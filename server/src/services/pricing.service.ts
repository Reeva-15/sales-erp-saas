import { prisma } from '../utils/prisma';

export interface PriceCalculationParams {
  tenantId: string;
  customerId: string;
  productId: string;
  quantity: number;
  priceListId?: string | null;
}

export interface PricingResult {
  productId: string;
  productName: string;
  standardPrice: number;
  appliedRate: number;
  discountPercent: number;
  finalUnitRate: number;
  appliedRuleType: string;
  ruleDescription: string;
}

export class PricingService {
  /**
   * Authoritative backend pricing calculation engine.
   * Finds matching active rules based on priority and applies them.
   */
  static async calculateItemPrice(params: PriceCalculationParams): Promise<PricingResult> {
    const { tenantId, customerId, productId, quantity, priceListId } = params;

    // 1. Fetch Product
    const product = await prisma.product.findFirst({
      where: { id: productId, tenantId }
    });

    if (!product) {
      throw new Error(`Product not found or inactive.`);
    }

    const standardPrice = product.sellingPrice;

    // Fetch Customer to get customerGroupId & assigned priceListId
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, tenantId }
    });

    const activePriceListId = priceListId || customer?.priceListId;
    const now = new Date();

    // Fetch all active rules for this tenant & product
    const rules = await prisma.pricingRule.findMany({
      where: {
        tenantId,
        productId,
        active: true,
        AND: [
          { OR: [{ validFrom: null }, { validFrom: { lte: now } }] },
          { OR: [{ validTo: null }, { validTo: { gte: now } }] }
        ]
      },
      orderBy: { priority: 'asc' }
    });

    let selectedRule: any = null;
    let appliedRuleType = 'STANDARD';
    let ruleDescription = 'Standard Product Base Price';

    // Priority 1: Special Customer Specific Price Rule
    if (!selectedRule && customerId) {
      selectedRule = rules.find(
        (r) => r.ruleType === 'SPECIAL_CUSTOMER' && r.customerId === customerId && quantity >= r.minQty && (!r.maxQty || quantity <= r.maxQty)
      );
      if (selectedRule) {
        appliedRuleType = 'SPECIAL_CUSTOMER';
        ruleDescription = `Special Customer Negotiated Rate`;
      }
    }

    // Priority 2: Customer Group Price Rule
    if (!selectedRule && customer?.customerGroupId) {
      selectedRule = rules.find(
        (r) => r.ruleType === 'CUSTOMER_GROUP' && r.customerGroupId === customer.customerGroupId && quantity >= r.minQty && (!r.maxQty || quantity <= r.maxQty)
      );
      if (selectedRule) {
        appliedRuleType = 'CUSTOMER_GROUP';
        ruleDescription = `Customer Group Special Pricing`;
      }
    }

    // Priority 3: Quantity Tier Pricing
    if (!selectedRule) {
      selectedRule = rules.find(
        (r) => r.ruleType === 'QUANTITY_TIER' && quantity >= r.minQty && (!r.maxQty || quantity <= r.maxQty)
      );
      if (selectedRule) {
        appliedRuleType = 'QUANTITY_TIER';
        ruleDescription = `Volume Discount Tier (${quantity}+ units)`;
      }
    }

    // Priority 4: Price List Rule
    if (!selectedRule && activePriceListId) {
      selectedRule = rules.find(
        (r) => r.ruleType === 'PRICE_LIST' && r.priceListId === activePriceListId && quantity >= r.minQty && (!r.maxQty || quantity <= r.maxQty)
      );
      if (selectedRule) {
        appliedRuleType = 'PRICE_LIST';
        ruleDescription = `Assigned Price List Pricing`;
      }
    }

    // Calculate final numbers
    let appliedRate = standardPrice;
    let discountPercent = 0;

    if (selectedRule) {
      appliedRate = selectedRule.rate;
      discountPercent = selectedRule.discountPercent || 0;
    } else if (customer?.customerGroupId) {
      // Check customer group default discount
      const cGroup = await prisma.customerGroup.findUnique({ where: { id: customer.customerGroupId } });
      if (cGroup && cGroup.discountPercent > 0) {
        discountPercent = cGroup.discountPercent;
        appliedRuleType = 'CUSTOMER_GROUP_DISCOUNT';
        ruleDescription = `Customer Group Default Discount (${discountPercent}%)`;
      }
    }

    const discountAmountPerUnit = (appliedRate * discountPercent) / 100;
    const finalUnitRate = Math.max(0, appliedRate - discountAmountPerUnit);

    return {
      productId: product.id,
      productName: product.name,
      standardPrice,
      appliedRate,
      discountPercent,
      finalUnitRate,
      appliedRuleType,
      ruleDescription
    };
  }
}
