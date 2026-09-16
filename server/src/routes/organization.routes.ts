import { Router } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';
import { requireTenant } from '../middleware/tenant.middleware';
import { prisma } from '../utils/prisma';
import bcrypt from 'bcryptjs';

const router = Router();
router.use(authenticateToken, requireTenant);

// Companies
router.get('/companies', async (req: AuthRequest, res) => {
  const companies = await prisma.company.findMany({ where: { tenantId: req.tenantId! } });
  res.json({ success: true, data: companies });
});

router.post('/companies', async (req: AuthRequest, res) => {
  const { code, name, address, city, state, country, gstin } = req.body;
  const company = await prisma.company.create({
    data: { tenantId: req.tenantId!, code, name, address, city, state, country, gstin }
  });
  res.json({ success: true, data: company });
});

// Branches
router.get('/branches', async (req: AuthRequest, res) => {
  const branches = await prisma.branch.findMany({ where: { tenantId: req.tenantId! }, include: { company: true } });
  res.json({ success: true, data: branches });
});

router.post('/branches', async (req: AuthRequest, res) => {
  const { companyId, code, name, address, city, state, country, gstin } = req.body;
  const branch = await prisma.branch.create({
    data: { tenantId: req.tenantId!, companyId, code, name, address, city, state, country, gstin }
  });
  res.json({ success: true, data: branch });
});

// Departments
router.get('/departments', async (req: AuthRequest, res) => {
  const departments = await prisma.department.findMany({ where: { tenantId: req.tenantId! } });
  res.json({ success: true, data: departments });
});

router.post('/departments', async (req: AuthRequest, res) => {
  const { companyId, code, name } = req.body;
  const dept = await prisma.department.create({
    data: { tenantId: req.tenantId!, companyId, code, name }
  });
  res.json({ success: true, data: dept });
});

// Roles & Permissions
router.get('/roles', async (req: AuthRequest, res) => {
  const roles = await prisma.role.findMany({
    where: { OR: [{ tenantId: req.tenantId! }, { tenantId: null }] },
    include: { permissions: { include: { permission: true } } }
  });
  res.json({ success: true, data: roles });
});

router.post('/roles', async (req: AuthRequest, res) => {
  const { code, name, description } = req.body;
  const role = await prisma.role.create({
    data: { tenantId: req.tenantId!, code, name, description }
  });
  res.json({ success: true, data: role });
});

router.get('/permissions', async (req: AuthRequest, res) => {
  const permissions = await prisma.permission.findMany();
  res.json({ success: true, data: permissions });
});

// Users
router.get('/users', async (req: AuthRequest, res) => {
  const users = await prisma.user.findMany({
    where: { tenantId: req.tenantId! },
    include: { role: true, company: true, branch: true, department: true },
    orderBy: { createdAt: 'desc' }
  });
  res.json({ success: true, data: users });
});

router.post('/users', async (req: AuthRequest, res) => {
  try {
    const { name, email, mobile, username, password, roleId, companyId, branchId, departmentId, employeeCode } = req.body;
    const passwordHash = await bcrypt.hash(password || 'Password@123', 10);

    const user = await prisma.user.create({
      data: {
        tenantId: req.tenantId!,
        companyId: companyId || null,
        branchId: branchId || null,
        departmentId: departmentId || null,
        employeeCode,
        name,
        email,
        mobile,
        username,
        passwordHash,
        roleId: roleId || null,
        status: 'ACTIVE'
      },
      include: { role: true }
    });
    res.json({ success: true, data: user });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

export default router;
