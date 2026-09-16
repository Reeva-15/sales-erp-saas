import { prisma } from '../utils/prisma';

export interface CreateCustomFieldInput {
  tenantId: string;
  module: 'CUSTOMER' | 'PRODUCT' | 'ENQUIRY' | 'QUOTATION' | 'SALES_ORDER' | 'INVOICE';
  fieldName: string;
  fieldLabel: string;
  fieldType: 'TEXT' | 'NUMBER' | 'DECIMAL' | 'DATE' | 'DROPDOWN' | 'MULTI_SELECT' | 'CHECKBOX' | 'FILE' | 'CUSTOMER_SELECTOR' | 'PRODUCT_SELECTOR' | 'USER_SELECTOR';
  options?: string[];
  isRequired?: boolean;
  defaultValue?: string;
  displayOrder?: number;
}

export class CustomFieldService {
  static async createField(input: CreateCustomFieldInput) {
    const field = await prisma.customField.create({
      data: {
        tenantId: input.tenantId,
        module: input.module,
        fieldName: input.fieldName.toLowerCase().replace(/\s+/g, '_'),
        fieldLabel: input.fieldLabel,
        fieldType: input.fieldType,
        optionsJson: JSON.stringify(input.options || []),
        isRequired: input.isRequired || false,
        defaultValue: input.defaultValue || null,
        displayOrder: input.displayOrder || 1
      }
    });
    return field;
  }

  static async getFieldsForModule(tenantId: string, module: string) {
    const fields = await prisma.customField.findMany({
      where: { tenantId, module, active: true },
      orderBy: { displayOrder: 'asc' }
    });
    return fields.map((f) => ({
      ...f,
      options: JSON.parse(f.optionsJson || '[]')
    }));
  }

  static async saveFieldValues(tenantId: string, recordId: string, values: Record<string, any>) {
    for (const [customFieldId, val] of Object.entries(values)) {
      await prisma.customFieldValue.upsert({
        where: {
          customFieldId_recordId: { customFieldId, recordId }
        },
        create: {
          tenantId,
          customFieldId,
          recordId,
          valueJson: JSON.stringify(val)
        },
        update: {
          valueJson: JSON.stringify(val)
        }
      });
    }
  }

  static async getFieldValuesForRecord(recordId: string) {
    const values = await prisma.customFieldValue.findMany({
      where: { recordId },
      include: { customField: true }
    });

    const result: Record<string, any> = {};
    for (const v of values) {
      result[v.customField.fieldName] = JSON.parse(v.valueJson);
    }
    return result;
  }
}
