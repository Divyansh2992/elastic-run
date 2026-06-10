import { useEffect, useMemo, useReducer, useState } from 'react';

const CITY_ALIASES = {
  Bangalore: 'Bengaluru',
  Bombay: 'Mumbai',
  NCR: 'Delhi',
};

const DATE_OPTIONS = ['Today', 'Tomorrow', 'This Week', 'Custom'];
const DEPARTURE_SLOTS = ['6AM', '10AM', '2PM', '6PM', 'Night'];
const DAY_TYPES = ['Weekday', 'Weekend', 'Holiday', 'Festival'];
const HORIZONS = ['Today', '3-Day', '7-Day', '14-Day'];
const ZONE_OPTIONS = ['North', 'South', 'East', 'West', 'Central'];
const ROUTE_TYPES = ['Direct', 'Hub & Spoke', 'Multi-hop', 'Cross-dock'];
const DISTANCE_BANDS = ['Intra-city', '<100km', '100–300km', '300–800km', '800km+'];
const CORRIDOR_TYPES = ['Metro→Metro', 'Metro→Tier2', 'Tier2→Tier3', 'Rural'];
const PARTNER_TYPES = ['Aggregator', 'Direct', 'Hyperlocal', 'Franchise', 'Owned'];
const PARTNER_TIERS = ['Tier 1', 'Tier 2', 'Backup', 'Trial'];
const PARTNER_STATUS = ['Active', 'Inactive', 'Suspended', 'On Leave'];
const COVERAGE_TYPES = ['First Mile', 'Last Mile', 'Both', 'Line Haul'];
const SLA_CONTRACTS = ['Premium', 'Standard', 'Best Effort'];
const PRODUCT_CATEGORIES = ['Electronics', 'Apparel', 'FMCG', 'Pharma', 'Perishable', 'Furniture', 'Books', 'Jewellery', 'Hazmat'];
const WEIGHT_BANDS = ['0–500g', '500g–2kg', '2–5kg', '5–10kg', '10–20kg', '20kg+'];
const VALUE_BANDS = ['<₹500', '₹500–2K', '₹2K–5K', '₹5K–10K', '₹10K+'];
const PAYMENT_METHODS = ['Prepaid', 'COD', 'Part-COD'];
const HANDLING_TYPES = ['Normal', 'Fragile', 'Cold Chain', 'High Value', 'Hazmat'];
const RETURNS_TYPES = ['Forward Only', 'Include RTO', 'Include RVP', 'Returns Only'];
const TRANSPORT_MODES = ['Surface', 'Air', 'Rail', 'Hyperlocal'];
const VEHICLE_TYPES = ['Bike', 'E-Bike', 'Auto 3W', 'Tempo', 'Tata Ace', 'LCV', 'MCV', 'HCV Truck', 'Container', 'Air Cargo'];
const VEHICLE_STATUS = ['Available', 'Assigned', 'En Route', 'Maintenance', 'Breakdown'];
const LOAD_TYPES = ['FTL', 'LTL', 'Parcel', 'Express'];
const OWNERSHIP_TYPES = ['Owned', 'Leased', 'Partner', 'Spot Market'];
const HUB_TYPES = ['Primary', 'Secondary', 'Micro-hub', 'Dark Store', 'Collection Point'];
const HUB_STATUS = ['Operational', 'Degraded', 'Offline'];
const HUB_TIERS = ['Tier 1', 'Tier 2', 'Tier 3', 'Rural'];
const UTILIZATION_BANDS = ['<50%', '50–75%', '75–90%', '90–100%', '>100%'];
const CAPACITY_STATUS = ['Available', 'Near Full', 'Full', 'Overbooked'];
const SHORTFALL_FLAGS = ['Predicted', 'Active', 'Resolved', 'None'];
const CONFIRMED_STATUS = ['Confirmed', 'Pending', 'Unconfirmed'];
const SLA_TYPES = ['Same Day', 'Next Day', '2-Day', 'Economy'];
const SLA_STATUS = ['Within SLA', 'At Risk', 'Breached'];
const PRIORITIES = ['Express', 'Standard', 'Economy'];
const WEATHER_ALERTS = ['Clear', 'Rain', 'Flood', 'Fog'];
const OPERATIONAL_FLAGS = ['Strike', 'Bandh', 'Permit Issue', 'Road Block'];

const CITY_POSITIONS = {
  Mumbai: { x: 220, y: 260 },
  Pune: { x: 210, y: 320 },
  Delhi: { x: 300, y: 80 },
  Jaipur: { x: 320, y: 140 },
  Bengaluru: { x: 260, y: 420 },
  Chennai: { x: 340, y: 480 },
  Kolkata: { x: 500, y: 220 },
  Hyderabad: { x: 360, y: 360 },
  Lucknow: { x: 380, y: 170 },
  Ahmedabad: { x: 180, y: 180 },
  Surat: { x: 200, y: 240 },
  Nagpur: { x: 390, y: 310 },
  Chandigarh: { x: 330, y: 70 },
  Kochi: { x: 300, y: 540 },
  Guwahati: { x: 620, y: 180 },
  Bhubaneswar: { x: 520, y: 280 },
  Indore: { x: 240, y: 220 },
  Ranchi: { x: 470, y: 290 },
  Varanasi: { x: 430, y: 210 },
  Thiruvananthapuram: { x: 260, y: 620 },
};

const PARTNER_BASE = [
  { name: 'BlueDart', code: 'BDT', type: 'Aggregator' },
  { name: 'Delhivery', code: 'DEL', type: 'Direct' },
  { name: 'Xpressbees', code: 'XBS', type: 'Aggregator' },
  { name: 'EcomExpress', code: 'EEX', type: 'Direct' },
  { name: 'Shadowfax', code: 'SFX', type: 'Hyperlocal' },
];

function buildRoute(spec, index) {
  const utilBase = spec.utilPercent || 70 + (index % 5) * 6;
  const totalCapacity = spec.totalCapacity || 2400 + (index % 7) * 360;
  const utilized = Math.floor(totalCapacity * (utilBase / 100));
  const available = Math.max(0, totalCapacity - utilized);
  const overbookPercent = utilBase > 100 ? parseFloat((utilBase - 100).toFixed(1)) : 0;
  const partners = PARTNER_BASE.slice(0, 4).map((partner, idx) => ({
    ...partner,
    utilPercent: Math.max(62, 95 - idx * 6 - (index % 3) * 2),
    assigned: 8 + idx * 4,
    available: Math.max(0, 16 - idx * 3),
    reliability: Math.max(82, 98 - idx * 3 - (index % 4) * 2),
  }));
  const areas = [
    {
      area: spec.area || 'Koregaon Park',
      pincode: spec.pincode || '411001',
      totalCapacity: Math.floor(totalCapacity * 0.18),
      utilized: Math.floor(utilized * 0.18),
      available: Math.max(0, Math.floor(totalCapacity * 0.18) - Math.floor(utilized * 0.18)),
      utilPercent: parseFloat((utilized * 0.18 / Math.max(1, totalCapacity * 0.18) * 100).toFixed(1)),
      shortfallFlag: index % 4 === 0 ? 'Active' : 'None',
      microZones: [
        { name: 'Beat A', capacity: 80, utilized: 72, utilPercent: 90, shortfallFlag: 'Active' },
        { name: 'Beat B', capacity: 70, utilized: 52, utilPercent: 74, shortfallFlag: 'Resolved' },
        { name: 'Beat C', capacity: 90, utilized: 81, utilPercent: 90, shortfallFlag: 'Predicted' },
      ],
    },
    {
      area: spec.area2 || 'Viman Nagar',
      pincode: spec.pincode2 || '411014',
      totalCapacity: Math.floor(totalCapacity * 0.14),
      utilized: Math.floor(utilized * 0.16),
      available: Math.max(0, Math.floor(totalCapacity * 0.14) - Math.floor(utilized * 0.16)),
      utilPercent: parseFloat((utilized * 0.16 / Math.max(1, totalCapacity * 0.14) * 100).toFixed(1)),
      shortfallFlag: index % 5 === 0 ? 'Predicted' : 'None',
      microZones: [
        { name: 'Beat X', capacity: 60, utilized: 44, utilPercent: 73, shortfallFlag: 'None' },
        { name: 'Beat Y', capacity: 70, utilized: 53, utilPercent: 76, shortfallFlag: 'None' },
      ],
    },
  ];
  const routeId = `${spec.originCity.toLowerCase()}-${spec.destCity.toLowerCase()}`.replace(/\s+/g, '-');
  return {
    routeId,
    ...spec,
    partnerType: spec.partnerType || 'Aggregator',
    partnerTier: spec.partnerTier || 'Tier 1',
    partnerStatus: spec.partnerStatus || 'Active',
    coverageType: spec.coverageType || 'Both',
    slaContract: spec.slaContract || 'Standard',
    productCategory: spec.productCategory || 'Electronics',
    weightBand: spec.weightBand || '2–5kg',
    shipmentValueBand: spec.shipmentValueBand || '₹2K–5K',
    paymentMethod: spec.paymentMethod || 'Prepaid',
    handlingType: spec.handlingType || 'Normal',
    returnsType: spec.returnsType || 'Forward Only',
    vehicleStatus: spec.vehicleStatus || 'Available',
    loadType: spec.loadType || 'LTL',
    vehicleOwnership: spec.vehicleOwnership || 'Partner',
    hubName: spec.hubName || `${spec.originCity} Hub`,
    hubType: spec.hubType || 'Primary',
    hubStatus: spec.hubStatus || 'Operational',
    hubTier: spec.hubTier || 'Tier 1',
    utilizationBand: spec.utilizationBand || (utilBase < 50 ? '<50%' : utilBase < 75 ? '50–75%' : utilBase < 90 ? '75–90%' : utilBase <= 100 ? '90–100%' : '>100%'),
    capacityStatus: spec.capacityStatus || (utilBase < 75 ? 'Available' : utilBase < 90 ? 'Near Full' : utilBase <= 100 ? 'Full' : 'Overbooked'),
    shortfallFlag: spec.shortfallFlag || (utilBase > 100 ? 'Active' : index % 7 === 0 ? 'Predicted' : 'None'),
    confirmedStatus: spec.confirmedStatus || 'Confirmed',
    slaType: spec.slaType || 'Same Day',
    slaStatus: spec.slaStatus || (utilBase > 90 ? 'At Risk' : 'Within SLA'),
    priority: spec.priority || 'Express',
    weatherAlert: spec.weatherAlert || 'Clear',
    operationalFlag: spec.operationalFlag || 'None',
    festivalFlag: spec.festivalFlag || false,
    totalCapacity,
    utilized,
    available,
    utilPercent: parseFloat(utilBase.toFixed(1)),
    overbookPercent,
    partnersActive: partners.length,
    topPartner: partners[0].name,
    partnerUtil: parseFloat(partners[0].utilPercent.toFixed(1)),
    reliabilityScore: partners[0].reliability,
    fleetAssigned: Math.max(24, Math.floor(totalCapacity / 15)),
    fleetAvailable: Math.max(6, Math.floor(available / 20)),
    loadFactorWeight: Math.max(62, Math.floor(utilBase * 0.82)),
    loadFactorVolume: Math.max(58, Math.floor(utilBase * 0.75)),
    departuresToday: 3 + (index % 4),
    cutOffTime: `${9 + (index % 5)}AM`,
    aot: Math.max(85, 95 - index),
    dot: Math.max(82, 92 - index),
    dsr: Math.max(88, 96 - index),
    fasr: Math.max(90, 98 - index),
    atRiskCount: index % 4,
    avgWeight: parseFloat((1.2 + (index % 4) * 0.4).toFixed(1)),
    codPercent: index % 3 === 0 ? 12 : 8,
    highValueCount: Math.floor(totalCapacity * 0.04),
    restrictedFlag: Math.random() > 0.8 ? 'Yes' : 'No',
    costShipment: Math.floor(75 + index * 2),
    costKg: parseFloat((18 + index * 0.4).toFixed(1)),
    totalFreight: Math.floor(totalCapacity * (80 + index * 2)),
    partners,
    areas,
    departures: DEPARTURE_SLOTS.map((slot, i) => ({ slot, capacity: 50 + (index % 5) * 10 - i * 4, available: Math.max(3, 30 - i * 5 - (index % 4) * 2) })),
  };
}

const ROUTE_SPECS = [
  { originCity: 'Mumbai', originCode: 'BOM', destCity: 'Pune', destCode: 'PNQ', zone: 'West', state: 'Maharashtra', routeType: 'Direct', distanceBand: '<100km', corridorType: 'Metro→Tier2', mode: 'Surface', vehicleType: 'LCV', productCategory: 'Electronics', weightBand: '2–5kg', shipmentValueBand: '₹2K–5K', partnerType: 'Aggregator', partnerTier: 'Tier 1', routeLabel: 'Mumbai → Pune', pincode: '411001', area: 'Koregaon Park', pincode2: '411014', area2: 'Viman Nagar', utilPercent: 87.4, totalCapacity: 3200, weatherAlert: 'Rain', operationalFlag: 'Permit Issue' },
  { originCity: 'Delhi', originCode: 'DEL', destCity: 'Jaipur', destCode: 'JAI', zone: 'North', state: 'Rajasthan', routeType: 'Direct', distanceBand: '300–800km', corridorType: 'Metro→Tier2', mode: 'Surface', vehicleType: 'MCV', productCategory: 'Apparel', weightBand: '5–10kg', shipmentValueBand: '₹500–2K', partnerType: 'Direct', partnerTier: 'Tier 2', routeLabel: 'Delhi → Jaipur', pincode: '302001', area: 'Mansarovar', pincode2: '302019', area2: 'Vaishali Nagar', utilPercent: 78.2, totalCapacity: 2800, weatherAlert: 'Clear', operationalFlag: 'None' },
  { originCity: 'Bengaluru', originCode: 'BLR', destCity: 'Chennai', destCode: 'MAA', zone: 'South', state: 'Tamil Nadu', routeType: 'Hub & Spoke', distanceBand: '300–800km', corridorType: 'Metro→Metro', mode: 'Surface', vehicleType: 'HCV Truck', productCategory: 'FMCG', weightBand: '10–20kg', shipmentValueBand: '₹2K–5K', partnerType: 'Franchise', partnerTier: 'Tier 1', routeLabel: 'Bengaluru → Chennai', pincode: '600028', area: 'Velachery', pincode2: '600032', area2: 'Anna Nagar', utilPercent: 91.1, totalCapacity: 3400, weatherAlert: 'Clear', operationalFlag: 'None' },
  { originCity: 'Kolkata', originCode: 'CCU', destCity: 'Guwahati', destCode: 'GAU', zone: 'East', state: 'Assam', routeType: 'Direct', distanceBand: '800km+', corridorType: 'Metro→Tier2', mode: 'Air', vehicleType: 'Air Cargo', productCategory: 'Pharma', weightBand: '500g–2kg', shipmentValueBand: '₹5K–10K', partnerType: 'Direct', partnerTier: 'Tier 1', routeLabel: 'Kolkata → Guwahati', pincode: '781001', area: 'Ulubari', pincode2: '781006', area2: 'GS Road', utilPercent: 83.7, totalCapacity: 2400, weatherAlert: 'Fog', operationalFlag: 'Road Block' },
  { originCity: 'Hyderabad', originCode: 'HYD', destCity: 'Nagpur', destCode: 'NAG', zone: 'South', state: 'Maharashtra', routeType: 'Cross-dock', distanceBand: '300–800km', corridorType: 'Tier2→Tier3', mode: 'Surface', vehicleType: 'Tata Ace', productCategory: 'Furniture', weightBand: '20kg+', shipmentValueBand: '₹10K+', partnerType: 'Aggregator', partnerTier: 'Backup', routeLabel: 'Hyderabad → Nagpur', pincode: '440001', area: 'Sitabuldi', pincode2: '440008', area2: 'Ramdaspeth', utilPercent: 71.5, totalCapacity: 2600, weatherAlert: 'Clear', operationalFlag: 'None' },
  { originCity: 'Ahmedabad', originCode: 'AMD', destCity: 'Surat', destCode: 'STV', zone: 'West', state: 'Gujarat', routeType: 'Direct', distanceBand: '100–300km', corridorType: 'Metro→Tier2', mode: 'Surface', vehicleType: 'LCV', productCategory: 'Apparel', weightBand: '500g–2kg', shipmentValueBand: '₹500–2K', partnerType: 'Franchise', partnerTier: 'Tier 2', routeLabel: 'Ahmedabad → Surat', pincode: '395007', area: 'Adajan', pincode2: '395009', area2: 'Piplod', utilPercent: 65.8, totalCapacity: 2100, weatherAlert: 'Clear', operationalFlag: 'None' },
  { originCity: 'Lucknow', originCode: 'LKO', destCity: 'Varanasi', destCode: 'VNS', zone: 'North', state: 'Uttar Pradesh', routeType: 'Multi-hop', distanceBand: '300–800km', corridorType: 'Tier2→Tier3', mode: 'Rail', vehicleType: 'Container', productCategory: 'Electronics', weightBand: '2–5kg', shipmentValueBand: '₹5K–10K', partnerType: 'Owned', partnerTier: 'Tier 1', routeLabel: 'Lucknow → Varanasi', pincode: '221002', area: 'Sigra', pincode2: '221010', area2: 'Cantt', utilPercent: 73.9, totalCapacity: 2200, weatherAlert: 'Clear', operationalFlag: 'None' },
  { originCity: 'Chennai', originCode: 'MAA', destCity: 'Bengaluru', destCode: 'BLR', zone: 'South', state: 'Karnataka', routeType: 'Hub & Spoke', distanceBand: '300–800km', corridorType: 'Metro→Metro', mode: 'Surface', vehicleType: 'HCV Truck', productCategory: 'Pharma', weightBand: '5–10kg', shipmentValueBand: '₹2K–5K', partnerType: 'Direct', partnerTier: 'Tier 1', routeLabel: 'Chennai → Bengaluru', pincode: '560001', area: 'MG Road', pincode2: '560001', area2: 'Koramangala', utilPercent: 94.5, totalCapacity: 3600, weatherAlert: 'Clear', operationalFlag: 'None' },
  { originCity: 'Kochi', originCode: 'COK', destCity: 'Thiruvananthapuram', destCode: 'TRV', zone: 'South', state: 'Kerala', routeType: 'Direct', distanceBand: '300–800km', corridorType: 'Tier2→Tier3', mode: 'Surface', vehicleType: 'Auto 3W', productCategory: 'Perishable', weightBand: '0–500g', shipmentValueBand: '<₹500', partnerType: 'Hyperlocal', partnerTier: 'Trial', routeLabel: 'Kochi → Thiruvananthapuram', pincode: '695001', area: 'Kowdiar', pincode2: '695014', area2: 'Vazhuthacaud', utilPercent: 62.2, totalCapacity: 1800, weatherAlert: 'Rain', operationalFlag: 'None' },
  { originCity: 'Surat', originCode: 'STV', destCity: 'Ahmedabad', destCode: 'AMD', zone: 'West', state: 'Gujarat', routeType: 'Direct', distanceBand: '100–300km', corridorType: 'Metro→Tier2', mode: 'Surface', vehicleType: 'Tempo', productCategory: 'FMCG', weightBand: '5–10kg', shipmentValueBand: '₹500–2K', partnerType: 'Aggregator', partnerTier: 'Tier 2', routeLabel: 'Surat → Ahmedabad', pincode: '380015', area: 'Varachha', pincode2: '380054', area2: 'Vesu', utilPercent: 81.4, totalCapacity: 2300, weatherAlert: 'Clear', operationalFlag: 'None' },
  { originCity: 'Nagpur', originCode: 'NAG', destCity: 'Hyderabad', destCode: 'HYD', zone: 'Central', state: 'Telangana', routeType: 'Cross-dock', distanceBand: '300–800km', corridorType: 'Tier2→Tier3', mode: 'Surface', vehicleType: 'MCV', productCategory: 'Furniture', weightBand: '20kg+', shipmentValueBand: '₹10K+', partnerType: 'Franchise', partnerTier: 'Backup', routeLabel: 'Nagpur → Hyderabad', pincode: '500001', area: 'Banjara Hills', pincode2: '500034', area2: 'Madhapur', utilPercent: 77.8, totalCapacity: 2900, weatherAlert: 'Clear', operationalFlag: 'None' },
  { originCity: 'Chandigarh', originCode: 'IXC', destCity: 'Ludhiana', destCode: 'LUH', zone: 'North', state: 'Punjab', routeType: 'Direct', distanceBand: '100–300km', corridorType: 'Metro→Tier2', mode: 'Surface', vehicleType: 'LCV', productCategory: 'Jewellery', weightBand: '500g–2kg', shipmentValueBand: '₹5K–10K', partnerType: 'Aggregator', partnerTier: 'Tier 1', routeLabel: 'Chandigarh → Ludhiana', pincode: '141001', area: 'Model Town', pincode2: '141002', area2: 'Ferozepur Road', utilPercent: 89.6, totalCapacity: 2050, weatherAlert: 'Clear', operationalFlag: 'None' },
  { originCity: 'Amritsar', originCode: 'ATQ', destCity: 'Delhi', destCode: 'DEL', zone: 'North', state: 'Punjab', routeType: 'Multi-hop', distanceBand: '300–800km', corridorType: 'Tier2→Tier3', mode: 'Rail', vehicleType: 'Container', productCategory: 'Electronics', weightBand: '2–5kg', shipmentValueBand: '₹2K–5K', partnerType: 'Direct', partnerTier: 'Tier 2', routeLabel: 'Amritsar → Delhi', pincode: '143001', area: 'Hall Bazaar', pincode2: '110001', area2: 'Connaught Place', utilPercent: 76.5, totalCapacity: 2750, weatherAlert: 'Clear', operationalFlag: 'None' },
  { originCity: 'Bhopal', originCode: 'BHO', destCity: 'Indore', destCode: 'IDR', zone: 'Central', state: 'Madhya Pradesh', routeType: 'Hub & Spoke', distanceBand: '100–300km', corridorType: 'Tier2→Tier3', mode: 'Surface', vehicleType: 'HCV Truck', productCategory: 'FMCG', weightBand: '10–20kg', shipmentValueBand: '₹500–2K', partnerType: 'Owned', partnerTier: 'Tier 1', routeLabel: 'Bhopal → Indore', pincode: '452001', area: 'BHEL Road', pincode2: '452001', area2: 'MG Road', utilPercent: 84.0, totalCapacity: 2250, weatherAlert: 'Clear', operationalFlag: 'None' },
  { originCity: 'Varanasi', originCode: 'VNS', destCity: 'Lucknow', destCode: 'LKO', zone: 'North', state: 'Uttar Pradesh', routeType: 'Direct', distanceBand: '300–800km', corridorType: 'Tier2→Tier3', mode: 'Rail', vehicleType: 'Container', productCategory: 'Apparel', weightBand: '0–500g', shipmentValueBand: '<₹500', partnerType: 'Franchise', partnerTier: 'Trial', routeLabel: 'Varanasi → Lucknow', pincode: '221001', area: 'Godowlia', pincode2: '226001', area2: 'Hazratganj', utilPercent: 69.9, totalCapacity: 2100, weatherAlert: 'Clear', operationalFlag: 'None' },
  { originCity: 'Chennai', originCode: 'MAA', destCity: 'Kolkata', destCode: 'CCU', zone: 'East', state: 'West Bengal', routeType: 'Air', distanceBand: '800km+', corridorType: 'Metro→Metro', mode: 'Air', vehicleType: 'Air Cargo', productCategory: 'Pharma', weightBand: '500g–2kg', shipmentValueBand: '₹10K+', partnerType: 'Direct', partnerTier: 'Tier 1', routeLabel: 'Chennai → Kolkata', pincode: '700001', area: 'Park Street', pincode2: '700016', area2: 'Salt Lake', utilPercent: 92.0, totalCapacity: 2800, weatherAlert: 'Clear', operationalFlag: 'None' },
  { originCity: 'Bengaluru', originCode: 'BLR', destCity: 'Mumbai', destCode: 'BOM', zone: 'West', state: 'Maharashtra', routeType: 'Direct', distanceBand: '<100km', corridorType: 'Metro→Metro', mode: 'Surface', vehicleType: 'MCV', productCategory: 'Furniture', weightBand: '20kg+', shipmentValueBand: '₹10K+', partnerType: 'Aggregator', partnerTier: 'Tier 2', routeLabel: 'Bengaluru → Mumbai', pincode: '400001', area: 'Lower Parel', pincode2: '400021', area2: 'Bandra', utilPercent: 88.4, totalCapacity: 3300, weatherAlert: 'Clear', operationalFlag: 'None' },
  { originCity: 'Hyderabad', originCode: 'HYD', destCity: 'Chennai', destCode: 'MAA', zone: 'South', state: 'Tamil Nadu', routeType: 'Hub & Spoke', distanceBand: '300–800km', corridorType: 'Metro→Metro', mode: 'Surface', vehicleType: 'HCV Truck', productCategory: 'Pharma', weightBand: '10–20kg', shipmentValueBand: '₹5K–10K', partnerType: 'Direct', partnerTier: 'Tier 1', routeLabel: 'Hyderabad → Chennai', pincode: '600004', area: 'Nungambakkam', pincode2: '600008', area2: 'Guindy', utilPercent: 81.9, totalCapacity: 2950, weatherAlert: 'Clear', operationalFlag: 'None' },
  { originCity: 'Guwahati', originCode: 'GAU', destCity: 'Kolkata', destCode: 'CCU', zone: 'East', state: 'West Bengal', routeType: 'Air', distanceBand: '800km+', corridorType: 'Metro→Metro', mode: 'Air', vehicleType: 'Air Cargo', productCategory: 'Electronics', weightBand: '5–10kg', shipmentValueBand: '₹2K–5K', partnerType: 'Direct', partnerTier: 'Tier 2', routeLabel: 'Guwahati → Kolkata', pincode: '700015', area: 'New Town', pincode2: '700136', area2: 'Dumdum', utilPercent: 74.3, totalCapacity: 2200, weatherAlert: 'Rain', operationalFlag: 'None' },
  { originCity: 'Patna', originCode: 'PAT', destCity: 'Ranchi', destCode: 'IXR', zone: 'East', state: 'Jharkhand', routeType: 'Multi-hop', distanceBand: '300–800km', corridorType: 'Tier2→Tier3', mode: 'Surface', vehicleType: 'LCV', productCategory: 'FMCG', weightBand: '2–5kg', shipmentValueBand: '₹500–2K', partnerType: 'Aggregator', partnerTier: 'Backup', routeLabel: 'Patna → Ranchi', pincode: '834001', area: 'Gandhi Nagar', pincode2: '834002', area2: 'Hatia', utilPercent: 79.7, totalCapacity: 2100, weatherAlert: 'Clear', operationalFlag: 'None' },
  { originCity: 'Nagpur', originCode: 'NAG', destCity: 'Mumbai', destCode: 'BOM', zone: 'West', state: 'Maharashtra', routeType: 'Direct', distanceBand: '300–800km', corridorType: 'Tier2→Tier3', mode: 'Surface', vehicleType: 'MCV', productCategory: 'Automotive', weightBand: '20kg+', shipmentValueBand: '₹10K+', partnerType: 'Franchise', partnerTier: 'Tier 1', routeLabel: 'Nagpur → Mumbai', pincode: '400001', area: 'Lower Parel', pincode2: '400013', area2: 'Kurla', utilPercent: 95.6, totalCapacity: 3400, weatherAlert: 'Clear', operationalFlag: 'Permit Issue' },
  { originCity: 'Kochi', originCode: 'COK', destCity: 'Bengaluru', destCode: 'BLR', zone: 'South', state: 'Karnataka', routeType: 'Hub & Spoke', distanceBand: '300–800km', corridorType: 'Tier2→Tier3', mode: 'Surface', vehicleType: 'HCV Truck', productCategory: 'Perishable', weightBand: '5–10kg', shipmentValueBand: '₹500–2K', partnerType: 'Hyperlocal', partnerTier: 'Trial', routeLabel: 'Kochi → Bengaluru', pincode: '560001', area: 'Koramangala', pincode2: '560034', area2: 'Whitefield', utilPercent: 68.3, totalCapacity: 2000, weatherAlert: 'Rain', operationalFlag: 'None' },
  { originCity: 'Thiruvananthapuram', originCode: 'TRV', destCity: 'Chennai', destCode: 'MAA', zone: 'South', state: 'Tamil Nadu', routeType: 'Direct', distanceBand: '800km+', corridorType: 'Tier2→Tier3', mode: 'Air', vehicleType: 'Air Cargo', productCategory: 'Pharma', weightBand: '0–500g', shipmentValueBand: '₹10K+', partnerType: 'Direct', partnerTier: 'Tier 1', routeLabel: 'Trivandrum → Chennai', pincode: '600028', area: 'Velachery', pincode2: '600042', area2: 'Adyar', utilPercent: 90.8, totalCapacity: 1900, weatherAlert: 'Rain', operationalFlag: 'None' },
  { originCity: 'Bangalore', originCode: 'BLR', destCity: 'Delhi', destCode: 'DEL', zone: 'North', state: 'Delhi', routeType: 'Air', distanceBand: '800km+', corridorType: 'Metro→Metro', mode: 'Air', vehicleType: 'Air Cargo', productCategory: 'Electronics', weightBand: '2–5kg', shipmentValueBand: '₹5K–10K', partnerType: 'Direct', partnerTier: 'Tier 1', routeLabel: 'Bengaluru → Delhi', pincode: '110001', area: 'Connaught Place', pincode2: '110034', area2: 'Saket', utilPercent: 93.7, totalCapacity: 3600, weatherAlert: 'Clear', operationalFlag: 'None' },
];

const COLUMN_GROUPS = [
  { title: 'Capacity', key: 'capacity', columns: [
      { key: 'totalCapacity', label: 'Total Capacity' },
      { key: 'utilized', label: 'Utilized' },
      { key: 'available', label: 'Available' },
      { key: 'utilPercent', label: 'Util %' },
      { key: 'overbookPercent', label: 'Overbook %' },
    ] },
  { title: 'Partner', key: 'partner', columns: [
      { key: 'partnersActive', label: 'Partners Active' },
      { key: 'topPartner', label: 'Top Partner' },
      { key: 'partnerUtil', label: 'Partner Util %' },
      { key: 'reliabilityScore', label: 'Reliability Score' },
    ] },
  { title: 'Vehicle', key: 'vehicle', columns: [
      { key: 'mode', label: 'Mode' },
      { key: 'vehicleType', label: 'Vehicle Type' },
      { key: 'fleetAssigned', label: 'Fleet Assigned' },
      { key: 'fleetAvailable', label: 'Fleet Available' },
      { key: 'loadFactorWeight', label: 'Load Factor % (wt)' },
      { key: 'loadFactorVolume', label: 'Load Factor % (vol)' },
      { key: 'departuresToday', label: 'Departures Today' },
    ] },
  { title: 'SLA', key: 'sla', columns: [
      { key: 'slaType', label: 'SLA Type' },
      { key: 'cutOffTime', label: 'Cut-off' },
      { key: 'aot', label: 'AOT %' },
      { key: 'dot', label: 'DOT %' },
      { key: 'dsr', label: 'DSR %' },
      { key: 'fasr', label: 'FASR %' },
      { key: 'atRiskCount', label: 'At Risk Count' },
    ] },
  { title: 'Product', key: 'product', columns: [
      { key: 'topCategory', label: 'Top Category' },
      { key: 'avgWeight', label: 'Avg Weight (kg)' },
      { key: 'codPercent', label: 'COD %' },
      { key: 'highValueCount', label: 'High Value' },
      { key: 'restrictedFlag', label: 'Restricted' },
    ] },
  { title: 'Cost', key: 'cost', columns: [
      { key: 'costShipment', label: 'Cost / Shipment' },
      { key: 'costKg', label: 'Cost / kg' },
      { key: 'totalFreight', label: 'Total Freight' },
    ] },
  { title: 'Flags', key: 'flags', columns: [
      { key: 'shortfallFlag', label: 'Shortfall' },
      { key: 'weatherAlert', label: 'Weather' },
      { key: 'operationalFlag', label: 'Operational' },
    ] },
];

const initialColumnState = COLUMN_GROUPS.reduce((state, group) => {
  group.columns.forEach((column) => {
    state[column.key] = true;
  });
  return state;
}, {});

const initialFilterState = {
  dateRange: 'Today',
  customStart: '',
  customEnd: '',
  departureSlots: [],
  dayTypes: [],
  horizon: 'Today',
  zones: [],
  states: [],
  originCity: [],
  destinationCity: [],
  routeTypes: [],
  distanceBands: [],
  corridorTypes: [],
  partnerNames: [],
  partnerTypes: [],
  partnerTiers: [],
  partnerStatuses: [],
  coverageTypes: [],
  slaContracts: [],
  productCategories: [],
  weightBands: [],
  valueBands: [],
  paymentMethods: [],
  handlingTypes: [],
  returnsTypes: [],
  transportModes: [],
  vehicleTypes: [],
  vehicleStatuses: [],
  loadTypes: [],
  ownershipTypes: [],
  hubNames: [],
  hubTypes: [],
  hubStatuses: [],
  hubTiers: [],
  utilizationBands: [],
  capacityStatuses: [],
  shortfallFlags: [],
  confirmedStatuses: [],
  slaTypes: [],
  slaStatuses: [],
  priorities: [],
  weatherAlerts: [],
  operationalFlags: [],
  festivalFlag: null,
};

const initialSidebarState = {
  dateTime: true,
  geography: true,
  partner: false,
  product: false,
  mode: false,
  hub: false,
  capacity: false,
  sla: false,
  external: false,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_FILTER':
      return { ...state, filters: { ...state.filters, [action.key]: action.value } };
    case 'RESET_FILTERS':
      return { ...state, filters: initialFilterState, appliedFilters: initialFilterState };
    case 'APPLY_FILTERS':
      return { ...state, appliedFilters: { ...state.filters }, page: 1 };
    case 'TOGGLE_GROUP':
      return { ...state, sidebarOpen: { ...state.sidebarOpen, [action.group]: !state.sidebarOpen[action.group] } };
    case 'SET_SEARCH':
      return { ...state, searchOrigin: action.origin, searchDestination: action.destination, breadcrumbPath: [{ label: 'India', level: 0 }], page: 1 };
    case 'SELECT_BREADCRUMB':
      return { ...state, breadcrumbPath: action.path, selectedRouteId: action.selectedRouteId || '', page: 1 };
    case 'SET_SELECTED_ROUTE':
      return { ...state, selectedRouteId: action.routeId, page: 1 };
    case 'SET_EXPANDED_ROW':
      return { ...state, expandedRows: state.expandedRows.includes(action.routeId) ? state.expandedRows.filter((id) => id !== action.routeId) : [...state.expandedRows, action.routeId] };
    case 'TOGGLE_COLUMN':
      return { ...state, columns: { ...state.columns, [action.column]: !state.columns[action.column] } };
    case 'SET_SORT':
      return { ...state, sortKey: action.sortKey, sortDirection: action.sortDirection };
    case 'SET_PAGE':
      return { ...state, page: action.page };
    case 'SET_PAGE_SIZE':
      return { ...state, pageSize: action.pageSize, page: 1 };
    default:
      return state;
  }
}

function getStatusHue(utilPercent) {
  if (utilPercent >= 90) return 'status-badge--critical';
  if (utilPercent >= 75) return 'status-badge--warning';
  return 'status-badge--ok';
}

function withAlias(value) {
  return CITY_ALIASES[value] || value;
}

function isMatch(route, filters) {
  if (filters.zones.length && !filters.zones.includes(route.zone)) return false;
  if (filters.states.length && !filters.states.includes(route.state)) return false;
  if (filters.originCity.length && !filters.originCity.includes(route.originCity)) return false;
  if (filters.destinationCity.length && !filters.destinationCity.includes(route.destCity)) return false;
  if (filters.routeTypes.length && !filters.routeTypes.includes(route.routeType)) return false;
  if (filters.distanceBands.length && !filters.distanceBands.includes(route.distanceBand)) return false;
  if (filters.corridorTypes.length && !filters.corridorTypes.includes(route.corridorType)) return false;
  if (filters.transportModes.length && !filters.transportModes.includes(route.mode)) return false;
  if (filters.vehicleTypes.length && !filters.vehicleTypes.includes(route.vehicleType)) return false;
  if (filters.productCategories.length && !filters.productCategories.includes(route.productCategory)) return false;
  if (filters.weightBands.length && !filters.weightBands.includes(route.weightBand)) return false;
  if (filters.valueBands.length && !filters.valueBands.includes(route.shipmentValueBand)) return false;
  if (filters.paymentMethods.length && !filters.paymentMethods.includes(route.paymentMethod)) return false;
  if (filters.handlingTypes.length && !filters.handlingTypes.includes(route.handlingType)) return false;
  if (filters.returnsTypes.length && !filters.returnsTypes.includes(route.returnsType)) return false;
  if (filters.utilizationBands.length && !filters.utilizationBands.includes(route.utilizationBand)) return false;
  if (filters.capacityStatuses.length && !filters.capacityStatuses.includes(route.capacityStatus)) return false;
  if (filters.shortfallFlags.length && !filters.shortfallFlags.includes(route.shortfallFlag)) return false;
  if (filters.slaTypes.length && !filters.slaTypes.includes(route.slaType)) return false;
  if (filters.slaStatuses.length && !filters.slaStatuses.includes(route.slaStatus)) return false;
  if (filters.priorities.length && !filters.priorities.includes(route.priority)) return false;
  if (filters.weatherAlerts.length && !filters.weatherAlerts.includes(route.weatherAlert)) return false;
  if (filters.operationalFlags.length && !filters.operationalFlags.includes(route.operationalFlag)) return false;
  if (filters.festivalFlag !== null && route.festivalFlag !== filters.festivalFlag) return false;
  if (filters.partnerNames.length && !filters.partnerNames.some((name) => route.partners.some((partner) => partner.name === name))) return false;
  return true;
}

function RouteRow({ row, onExpand, expanded, onSelect }) {
  return (
    <div className={`route-table-row ${row.utilPercent > 90 ? 'route-row--danger' : row.utilPercent >= 75 ? 'route-row--warning' : ''}`}>
      <div className="route-table-cell route-table-cell--main" onClick={onSelect}>
        <button type="button" className="route-row-select">▸</button>
        <div>
          <div className="route-row-title">{row.originCity} → {row.destCity}</div>
          <div className="route-row-subline">{row.state} • {row.distanceBand}</div>
        </div>
      </div>
      <div className="route-table-cell">{row.routeType}</div>
      <div className="route-table-cell">{(row.totalCapacity || 0).toLocaleString()}</div>
      <div className="route-table-cell">{(row.utilized || 0).toLocaleString()}</div>
      <div className="route-table-cell">{(row.available || 0).toLocaleString()}</div>
      <div className="route-table-cell"><span className={`util-chip ${getStatusHue(row.utilPercent)}`}>{row.utilPercent}%</span></div>
      <div className="route-table-cell">{row.partnersActive}</div>
      <div className="route-table-cell">{row.topPartner}</div>
      <div className="route-table-cell">{row.mode}</div>
      <div className="route-table-cell">{row.vehicleType}</div>
      <div className="route-table-cell">{row.fleetAssigned}</div>
      <div className="route-table-cell">{row.fleetAvailable}</div>
      <div className="route-table-cell">{row.departuresToday}</div>
      <div className="route-table-cell">{row.slaType}</div>
      <button type="button" className="route-expand-btn" onClick={onExpand}>{expanded ? 'Hide' : 'Partners'}</button>
    </div>
  );
}

function FilterChip({ selected, label, onClick }) {
  return (
    <button type="button" className={`filter-chip ${selected ? 'filter-chip--active' : ''}`} onClick={onClick}>
      {label}
    </button>
  );
}

export default function RouteExplorer() {
  const [state, dispatch] = useReducer(reducer, {
    filters: initialFilterState,
    appliedFilters: initialFilterState,
    sidebarOpen: initialSidebarState,
    searchOrigin: '',
    searchDestination: '',
    breadcrumbPath: [{ label: 'India', level: 0 }],
    selectedRouteId: '',
    expandedRows: [],
    columns: initialColumnState,
    sortKey: 'utilPercent',
    sortDirection: 'desc',
    page: 1,
    pageSize: 25,
  });
  const [recentSearches, setRecentSearches] = useState([]);
  const [searchOriginInput, setSearchOriginInput] = useState('');
  const [searchDestinationInput, setSearchDestinationInput] = useState('');
  const [showColumnPicker, setShowColumnPicker] = useState(false);

  const routes = useMemo(() => ROUTE_SPECS.map((spec, index) => buildRoute(spec, index)), []);
  const cityOptions = useMemo(() => Array.from(new Set(routes.flatMap((item) => [item.originCity, item.destCity]))).sort(), [routes]);
  const matchedOriginSuggestions = useMemo(() => {
    const text = searchOriginInput.trim().toLowerCase();
    return cityOptions.filter((city) => city.toLowerCase().includes(text)).slice(0, 6);
  }, [cityOptions, searchOriginInput]);
  const matchedDestinationSuggestions = useMemo(() => {
    const text = searchDestinationInput.trim().toLowerCase();
    return cityOptions.filter((city) => city.toLowerCase().includes(text)).slice(0, 6);
  }, [cityOptions, searchDestinationInput]);

  const activeFilterCount = useMemo(() => Object.entries(state.filters).reduce((count, [, value]) => {
    if (Array.isArray(value)) return count + value.length;
    if (value === null || value === '' || value === false) return count;
    return count + 1;
  }, 0), [state.filters]);

  const scopeRoutes = useMemo(() => {
    let filtered = routes.filter((route) => isMatch(route, state.appliedFilters));
    state.breadcrumbPath.slice(1).forEach((item) => {
      if (item.level === 1) filtered = filtered.filter((route) => route.zone === item.value);
      if (item.level === 2) filtered = filtered.filter((route) => route.state === item.value);
      if (item.level === 3) filtered = filtered.filter((route) => route.originCity === item.value);
      if (item.level === 4) filtered = filtered.filter((route) => route.routeId === item.value);
      if (item.level === 5) filtered = filtered.filter((route) => route.areas.some((area) => area.area === item.value || area.pincode === item.value));
      if (item.level === 6) filtered = filtered.filter((route) => route.areas.some((area) => area.microZones.some((micro) => micro.name === item.value)));
    });
    return filtered;
  }, [routes, state.appliedFilters, state.breadcrumbPath]);

  const selectedRoute = useMemo(() => routes.find((route) => route.routeId === state.selectedRouteId) || scopeRoutes[0] || null, [routes, scopeRoutes, state.selectedRouteId]);
  const displayLevel = state.breadcrumbPath[state.breadcrumbPath.length - 1]?.level || 0;

  const tableRows = useMemo(() => {
    if (displayLevel >= 5 && selectedRoute) {
      const areaName = state.breadcrumbPath.find((item) => item.level === 5)?.value;
      const area = selectedRoute.areas.find((areaItem) => areaItem.area === areaName || areaItem.pincode === areaName);
      if (area && displayLevel === 5) {
        return area.microZones.map((micro, idx) => ({
          ...micro,
          routeId: `${selectedRoute.routeId}-area-${idx}`,
          originCity: selectedRoute.originCity,
          destCity: selectedRoute.destCity,
          routeType: selectedRoute.routeType,
          distanceBand: selectedRoute.distanceBand,
          topCategory: selectedRoute.topCategory,
          capacityStatus: micro.utilPercent > 90 ? 'Overbooked' : micro.utilPercent > 75 ? 'Full' : 'Available',
        }));
      }
      return selectedRoute.areas.map((areaItem, idx) => ({
        ...areaItem,
        routeId: `${selectedRoute.routeId}-area-${idx}`,
        originCity: selectedRoute.originCity,
        destCity: selectedRoute.destCity,
        routeType: selectedRoute.routeType,
        distanceBand: selectedRoute.distanceBand,
        topCategory: selectedRoute.topCategory,
        utilPercent: areaItem.utilPercent,
      }));
    }
    return scopeRoutes;
  }, [displayLevel, selectedRoute, scopeRoutes, state.breadcrumbPath]);

  useEffect(() => {
    if (scopeRoutes.length && !state.selectedRouteId) {
      dispatch({ type: 'SET_SELECTED_ROUTE', routeId: scopeRoutes[0].routeId });
    }
  }, [scopeRoutes, state.selectedRouteId]);

  const sortedRows = useMemo(() => {
    const rows = [...tableRows];
    rows.sort((a, b) => {
      const valueA = a[state.sortKey] || 0;
      const valueB = b[state.sortKey] || 0;
      if (typeof valueA === 'number' && typeof valueB === 'number') return state.sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
      return state.sortDirection === 'asc' ? String(valueA).localeCompare(String(valueB)) : String(valueB).localeCompare(String(valueA));
    });
    return rows;
  }, [tableRows, state.sortKey, state.sortDirection]);

  const pageCount = Math.max(1, Math.ceil(sortedRows.length / state.pageSize));
  const pageRows = sortedRows.slice((state.page - 1) * state.pageSize, state.page * state.pageSize);

  const totals = useMemo(() => ({
    totalCapacity: sortedRows.reduce((sum, item) => sum + (item.totalCapacity || 0), 0),
    utilized: sortedRows.reduce((sum, item) => sum + (item.utilized || 0), 0),
    available: sortedRows.reduce((sum, item) => sum + (item.available || 0), 0),
  }), [sortedRows]);

  const selectedRouteStats = useMemo(() => {
    if (!selectedRoute) return null;
    return {
      topPartners: selectedRoute.partners.slice(0, 3),
      modeCounts: TRANSPORT_MODES.map((mode) => ({ mode, value: selectedRoute.mode === mode ? 1 : 0 })),
      departures: selectedRoute.departures,
    };
  }, [selectedRoute]);

  const handleBreadcrumbClick = (index) => {
    const nextPath = state.breadcrumbPath.slice(0, index + 1);
    const selectedRouteId = nextPath.find((item) => item.level === 4)?.value || '';
    dispatch({ type: 'SELECT_BREADCRUMB', path: nextPath, selectedRouteId });
  };

  const handleRowClick = (row) => {
    if (displayLevel < 4 && row.routeId) {
      dispatch({ type: 'SELECT_BREADCRUMB', path: [
        { label: 'India', level: 0 },
        { label: row.zone, level: 1, value: row.zone },
        { label: row.state, level: 2, value: row.state },
        { label: row.originCity, level: 3, value: row.originCity },
        { label: `${row.originCity} → ${row.destCity}`, level: 4, value: row.routeId },
      ], selectedRouteId: row.routeId });
    } else if (displayLevel === 4 && row.area) {
      dispatch({ type: 'SELECT_BREADCRUMB', path: [...state.breadcrumbPath, { label: row.area, level: 5, value: row.area }], selectedRouteId: state.selectedRouteId });
    } else if (displayLevel === 5 && row.name) {
      dispatch({ type: 'SELECT_BREADCRUMB', path: [...state.breadcrumbPath, { label: row.name, level: 6, value: row.name }], selectedRouteId: state.selectedRouteId });
    }
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const origin = withAlias(searchOriginInput.trim());
    const destination = withAlias(searchDestinationInput.trim());
    if (!origin || !destination) return;
    const match = routes.find((route) => route.originCity === origin && route.destCity === destination);
    if (match) {
      dispatch({ type: 'SELECT_BREADCRUMB', path: [
        { label: 'India', level: 0 },
        { label: match.zone, level: 1, value: match.zone },
        { label: match.state, level: 2, value: match.state },
        { label: match.originCity, level: 3, value: match.originCity },
        { label: `${match.originCity} → ${match.destCity}`, level: 4, value: match.routeId },
      ], selectedRouteId: match.routeId });
    }
    dispatch({ type: 'SET_SEARCH', origin, destination });
    setRecentSearches((items) => {
      const pair = `${origin} → ${destination}`;
      const updated = [pair, ...items.filter((item) => item !== pair)];
      return updated.slice(0, 5);
    });
  };

  const handleSwap = () => {
    setSearchOriginInput(searchDestinationInput);
    setSearchDestinationInput(searchOriginInput);
  };

  const searchRows = useMemo(() => ({
    totalCapacity: totals.totalCapacity.toLocaleString(),
    utilized: `${totals.utilized.toLocaleString()}`,
    available: `${totals.available.toLocaleString()}`,
    activeRoutes: `${scopeRoutes.length} routes`,
    activePartners: `${new Set(scopeRoutes.flatMap((route) => route.partners.map((p) => p.name))).size} partners`,
    fleetAvailable: `${scopeRoutes.reduce((sum, route) => sum + route.fleetAvailable, 0)} vehicles`,
    shortfallRoutes: `${scopeRoutes.filter((route) => route.shortfallFlag !== 'None').length} routes`,
    avgUtilization: `${scopeRoutes.length ? (scopeRoutes.reduce((sum, route) => sum + route.utilPercent, 0) / scopeRoutes.length).toFixed(1) : 0}%`,
  }), [scopeRoutes, totals]);

  return (
    <div className="routes-tab">
      <div className="top-search-panel card">
        <div className="top-search-row">
          <div className="top-search-field">
            <label>Origin City</label>
            <input value={searchOriginInput} onChange={(e) => setSearchOriginInput(e.target.value)} placeholder="Search origin city" />
            {matchedOriginSuggestions.length > 0 && searchOriginInput && (
              <div className="autocomplete-list">
                {matchedOriginSuggestions.map((city) => (
                  <button type="button" key={city} onClick={() => setSearchOriginInput(city)} className="autocomplete-item">{city}</button>
                ))}
              </div>
            )}
          </div>
          <div className="top-search-swap">
            <button type="button" className="btn btn--ghost" onClick={handleSwap}>⇄</button>
          </div>
          <div className="top-search-field">
            <label>Destination City</label>
            <input value={searchDestinationInput} onChange={(e) => setSearchDestinationInput(e.target.value)} placeholder="Search destination city" />
            {matchedDestinationSuggestions.length > 0 && searchDestinationInput && (
              <div className="autocomplete-list">
                {matchedDestinationSuggestions.map((city) => (
                  <button type="button" key={city} onClick={() => setSearchDestinationInput(city)} className="autocomplete-item">{city}</button>
                ))}
              </div>
            )}
          </div>
          <button type="button" className="btn btn--primary top-search-go" onClick={handleSearchSubmit}>Search</button>
        </div>
        <div className="recent-searches">
          {recentSearches.map((pair) => (
            <button type="button" key={pair} className="recent-chip" onClick={() => {
              const [origin, destination] = pair.split(' → ');
              setSearchOriginInput(origin);
              setSearchDestinationInput(destination);
              setTimeout(handleSearchSubmit, 0);
            }}>{pair}</button>
          ))}
        </div>
      </div>

      <div className="routes-layout">
        <aside className="route-sidebar card">
          <div className="filter-header">
            <h3>Filter groups</h3>
            <span className="filter-count">{activeFilterCount} active</span>
          </div>

          <div className="filter-group">
            <button type="button" className="filter-group-title" onClick={() => dispatch({ type: 'TOGGLE_GROUP', group: 'dateTime' })}>
              <span>Date & Time</span>
              <span>{state.sidebarOpen.dateTime ? '▾' : '▸'}</span>
            </button>
            {state.sidebarOpen.dateTime && (
              <div className="filter-group-body">
                <div className="filter-row">
                  {DATE_OPTIONS.map((option) => (
                    <FilterChip key={option} label={option} selected={state.filters.dateRange === option} onClick={() => dispatch({ type: 'SET_FILTER', key: 'dateRange', value: option })} />
                  ))}
                </div>
                {state.filters.dateRange === 'Custom' && (
                  <div className="filter-row custom-dates">
                    <input type="date" value={state.filters.customStart} onChange={(e) => dispatch({ type: 'SET_FILTER', key: 'customStart', value: e.target.value })} />
                    <input type="date" value={state.filters.customEnd} onChange={(e) => dispatch({ type: 'SET_FILTER', key: 'customEnd', value: e.target.value })} />
                  </div>
                )}
                <div className="filter-row">
                  {DEPARTURE_SLOTS.map((slot) => (
                    <FilterChip key={slot} label={slot} selected={state.filters.departureSlots.includes(slot)} onClick={() => {
                      const next = state.filters.departureSlots.includes(slot) ? state.filters.departureSlots.filter((value) => value !== slot) : [...state.filters.departureSlots, slot];
                      dispatch({ type: 'SET_FILTER', key: 'departureSlots', value: next });
                    }} />
                  ))}
                </div>
                <div className="filter-row">
                  {DAY_TYPES.map((type) => (
                    <FilterChip key={type} label={type} selected={state.filters.dayTypes.includes(type)} onClick={() => {
                      const next = state.filters.dayTypes.includes(type) ? state.filters.dayTypes.filter((value) => value !== type) : [...state.filters.dayTypes, type];
                      dispatch({ type: 'SET_FILTER', key: 'dayTypes', value: next });
                    }} />
                  ))}
                </div>
                <div className="filter-row single-select">
                  {HORIZONS.map((horizon) => (
                    <FilterChip key={horizon} label={horizon} selected={state.filters.horizon === horizon} onClick={() => dispatch({ type: 'SET_FILTER', key: 'horizon', value: horizon })} />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="filter-group">
            <button type="button" className="filter-group-title" onClick={() => dispatch({ type: 'TOGGLE_GROUP', group: 'geography' })}>
              <span>Geography & Route</span>
              <span>{state.sidebarOpen.geography ? '▾' : '▸'}</span>
            </button>
            {state.sidebarOpen.geography && (
              <div className="filter-group-body">
                <div className="filter-row wrap">
                  {ZONE_OPTIONS.map((zone) => (
                    <FilterChip key={zone} label={zone} selected={state.filters.zones.includes(zone)} onClick={() => {
                      const next = state.filters.zones.includes(zone) ? state.filters.zones.filter((value) => value !== zone) : [...state.filters.zones, zone];
                      dispatch({ type: 'SET_FILTER', key: 'zones', value: next });
                    }} />
                  ))}
                </div>
                <div className="filter-section">
                  <label>State</label>
                  <select multiple value={state.filters.states} onChange={(e) => dispatch({ type: 'SET_FILTER', key: 'states', value: Array.from(e.target.selectedOptions).map((opt) => opt.value) })}>
                    {Array.from(new Set(routes.map((route) => route.state))).sort().map((stateName) => (
                      <option key={stateName} value={stateName}>{stateName}</option>
                    ))}
                  </select>
                </div>
                <div className="filter-section">
                  <label>Origin City</label>
                  <select multiple value={state.filters.originCity} onChange={(e) => dispatch({ type: 'SET_FILTER', key: 'originCity', value: Array.from(e.target.selectedOptions).map((opt) => opt.value) })}>
                    {Array.from(new Set(routes.map((route) => route.originCity))).sort().map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
                <div className="filter-section">
                  <label>Destination City</label>
                  <select multiple value={state.filters.destinationCity} onChange={(e) => dispatch({ type: 'SET_FILTER', key: 'destinationCity', value: Array.from(e.target.selectedOptions).map((opt) => opt.value) })}>
                    {Array.from(new Set(routes.map((route) => route.destCity))).sort().map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
                <div className="filter-row wrap">
                  {ROUTE_TYPES.map((type) => (
                    <FilterChip key={type} label={type} selected={state.filters.routeTypes.includes(type)} onClick={() => {
                      const next = state.filters.routeTypes.includes(type) ? state.filters.routeTypes.filter((value) => value !== type) : [...state.filters.routeTypes, type];
                      dispatch({ type: 'SET_FILTER', key: 'routeTypes', value: next });
                    }} />
                  ))}
                </div>
                <div className="filter-row wrap">
                  {DISTANCE_BANDS.map((band) => (
                    <FilterChip key={band} label={band} selected={state.filters.distanceBands.includes(band)} onClick={() => {
                      const next = state.filters.distanceBands.includes(band) ? state.filters.distanceBands.filter((value) => value !== band) : [...state.filters.distanceBands, band];
                      dispatch({ type: 'SET_FILTER', key: 'distanceBands', value: next });
                    }} />
                  ))}
                </div>
                <div className="filter-row wrap">
                  {CORRIDOR_TYPES.map((type) => (
                    <FilterChip key={type} label={type} selected={state.filters.corridorTypes.includes(type)} onClick={() => {
                      const next = state.filters.corridorTypes.includes(type) ? state.filters.corridorTypes.filter((value) => value !== type) : [...state.filters.corridorTypes, type];
                      dispatch({ type: 'SET_FILTER', key: 'corridorTypes', value: next });
                    }} />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="filter-group">
            <button type="button" className="filter-group-title" onClick={() => dispatch({ type: 'TOGGLE_GROUP', group: 'partner' })}>
              <span>Partner</span>
              <span>{state.sidebarOpen.partner ? '▾' : '▸'}</span>
            </button>
            {state.sidebarOpen.partner && (
              <div className="filter-group-body">
                <div className="filter-section">
                  <label>Partner Name</label>
                  <select multiple value={state.filters.partnerNames} onChange={(e) => dispatch({ type: 'SET_FILTER', key: 'partnerNames', value: Array.from(e.target.selectedOptions).map((opt) => opt.value) })}>
                    {PARTNER_BASE.map((partner) => (
                      <option key={partner.name} value={partner.name}>{partner.name} ({partner.code})</option>
                    ))}
                  </select>
                </div>
                <div className="filter-row wrap">
                  {PARTNER_TYPES.map((label) => (
                    <FilterChip key={label} label={label} selected={state.filters.partnerTypes.includes(label)} onClick={() => {
                      const next = state.filters.partnerTypes.includes(label) ? state.filters.partnerTypes.filter((value) => value !== label) : [...state.filters.partnerTypes, label];
                      dispatch({ type: 'SET_FILTER', key: 'partnerTypes', value: next });
                    }} />
                  ))}
                </div>
                <div className="filter-row wrap">
                  {PARTNER_TIERS.map((label) => (
                    <FilterChip key={label} label={label} selected={state.filters.partnerTiers.includes(label)} onClick={() => {
                      const next = state.filters.partnerTiers.includes(label) ? state.filters.partnerTiers.filter((value) => value !== label) : [...state.filters.partnerTiers, label];
                      dispatch({ type: 'SET_FILTER', key: 'partnerTiers', value: next });
                    }} />
                  ))}
                </div>
                <div className="filter-row wrap">
                  {PARTNER_STATUS.map((label) => (
                    <FilterChip key={label} label={label} selected={state.filters.partnerStatuses.includes(label)} onClick={() => {
                      const next = state.filters.partnerStatuses.includes(label) ? state.filters.partnerStatuses.filter((value) => value !== label) : [...state.filters.partnerStatuses, label];
                      dispatch({ type: 'SET_FILTER', key: 'partnerStatuses', value: next });
                    }} />
                  ))}
                </div>
                <div className="filter-row wrap">
                  {COVERAGE_TYPES.map((label) => (
                    <FilterChip key={label} label={label} selected={state.filters.coverageTypes.includes(label)} onClick={() => {
                      const next = state.filters.coverageTypes.includes(label) ? state.filters.coverageTypes.filter((value) => value !== label) : [...state.filters.coverageTypes, label];
                      dispatch({ type: 'SET_FILTER', key: 'coverageTypes', value: next });
                    }} />
                  ))}
                </div>
                <div className="filter-row wrap">
                  {SLA_CONTRACTS.map((label) => (
                    <FilterChip key={label} label={label} selected={state.filters.slaContracts.includes(label)} onClick={() => {
                      const next = state.filters.slaContracts.includes(label) ? state.filters.slaContracts.filter((value) => value !== label) : [...state.filters.slaContracts, label];
                      dispatch({ type: 'SET_FILTER', key: 'slaContracts', value: next });
                    }} />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="filter-group">
            <button type="button" className="filter-group-title" onClick={() => dispatch({ type: 'TOGGLE_GROUP', group: 'product' })}>
              <span>Product & Shipment</span>
              <span>{state.sidebarOpen.product ? '▾' : '▸'}</span>
            </button>
            {state.sidebarOpen.product && (
              <div className="filter-group-body">
                <div className="filter-row wrap">
                  {PRODUCT_CATEGORIES.map((label) => (
                    <FilterChip key={label} label={label} selected={state.filters.productCategories.includes(label)} onClick={() => {
                      const next = state.filters.productCategories.includes(label) ? state.filters.productCategories.filter((value) => value !== label) : [...state.filters.productCategories, label];
                      dispatch({ type: 'SET_FILTER', key: 'productCategories', value: next });
                    }} />
                  ))}
                </div>
                <div className="filter-row wrap">
                  {WEIGHT_BANDS.map((label) => (
                    <FilterChip key={label} label={label} selected={state.filters.weightBands.includes(label)} onClick={() => {
                      const next = state.filters.weightBands.includes(label) ? state.filters.weightBands.filter((value) => value !== label) : [...state.filters.weightBands, label];
                      dispatch({ type: 'SET_FILTER', key: 'weightBands', value: next });
                    }} />
                  ))}
                </div>
                <div className="filter-row wrap">
                  {VALUE_BANDS.map((label) => (
                    <FilterChip key={label} label={label} selected={state.filters.valueBands.includes(label)} onClick={() => {
                      const next = state.filters.valueBands.includes(label) ? state.filters.valueBands.filter((value) => value !== label) : [...state.filters.valueBands, label];
                      dispatch({ type: 'SET_FILTER', key: 'valueBands', value: next });
                    }} />
                  ))}
                </div>
                <div className="filter-row wrap">
                  {PAYMENT_METHODS.map((label) => (
                    <FilterChip key={label} label={label} selected={state.filters.paymentMethods.includes(label)} onClick={() => {
                      const next = state.filters.paymentMethods.includes(label) ? state.filters.paymentMethods.filter((value) => value !== label) : [...state.filters.paymentMethods, label];
                      dispatch({ type: 'SET_FILTER', key: 'paymentMethods', value: next });
                    }} />
                  ))}
                </div>
                <div className="filter-row wrap">
                  {HANDLING_TYPES.map((label) => (
                    <FilterChip key={label} label={label} selected={state.filters.handlingTypes.includes(label)} onClick={() => {
                      const next = state.filters.handlingTypes.includes(label) ? state.filters.handlingTypes.filter((value) => value !== label) : [...state.filters.handlingTypes, label];
                      dispatch({ type: 'SET_FILTER', key: 'handlingTypes', value: next });
                    }} />
                  ))}
                </div>
                <div className="filter-row wrap">
                  {RETURNS_TYPES.map((label) => (
                    <FilterChip key={label} label={label} selected={state.filters.returnsTypes.includes(label)} onClick={() => {
                      const next = state.filters.returnsTypes.includes(label) ? state.filters.returnsTypes.filter((value) => value !== label) : [...state.filters.returnsTypes, label];
                      dispatch({ type: 'SET_FILTER', key: 'returnsTypes', value: next });
                    }} />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="filter-group">
            <button type="button" className="filter-group-title" onClick={() => dispatch({ type: 'TOGGLE_GROUP', group: 'mode' })}>
              <span>Mode & Vehicle</span>
              <span>{state.sidebarOpen.mode ? '▾' : '▸'}</span>
            </button>
            {state.sidebarOpen.mode && (
              <div className="filter-group-body">
                <div className="filter-row wrap">
                  {TRANSPORT_MODES.map((label) => (
                    <FilterChip key={label} label={label} selected={state.filters.transportModes.includes(label)} onClick={() => {
                      const next = state.filters.transportModes.includes(label) ? state.filters.transportModes.filter((value) => value !== label) : [...state.filters.transportModes, label];
                      dispatch({ type: 'SET_FILTER', key: 'transportModes', value: next });
                    }} />
                  ))}
                </div>
                <div className="filter-row wrap">
                  {VEHICLE_TYPES.map((label) => (
                    <FilterChip key={label} label={label} selected={state.filters.vehicleTypes.includes(label)} onClick={() => {
                      const next = state.filters.vehicleTypes.includes(label) ? state.filters.vehicleTypes.filter((value) => value !== label) : [...state.filters.vehicleTypes, label];
                      dispatch({ type: 'SET_FILTER', key: 'vehicleTypes', value: next });
                    }} />
                  ))}
                </div>
                <div className="filter-row wrap">
                  {VEHICLE_STATUS.map((label) => (
                    <FilterChip key={label} label={label} selected={state.filters.vehicleStatuses.includes(label)} onClick={() => {
                      const next = state.filters.vehicleStatuses.includes(label) ? state.filters.vehicleStatuses.filter((value) => value !== label) : [...state.filters.vehicleStatuses, label];
                      dispatch({ type: 'SET_FILTER', key: 'vehicleStatuses', value: next });
                    }} />
                  ))}
                </div>
                <div className="filter-row wrap">
                  {LOAD_TYPES.map((label) => (
                    <FilterChip key={label} label={label} selected={state.filters.loadTypes.includes(label)} onClick={() => {
                      const next = state.filters.loadTypes.includes(label) ? state.filters.loadTypes.filter((value) => value !== label) : [...state.filters.loadTypes, label];
                      dispatch({ type: 'SET_FILTER', key: 'loadTypes', value: next });
                    }} />
                  ))}
                </div>
                <div className="filter-row wrap">
                  {OWNERSHIP_TYPES.map((label) => (
                    <FilterChip key={label} label={label} selected={state.filters.ownershipTypes.includes(label)} onClick={() => {
                      const next = state.filters.ownershipTypes.includes(label) ? state.filters.ownershipTypes.filter((value) => value !== label) : [...state.filters.ownershipTypes, label];
                      dispatch({ type: 'SET_FILTER', key: 'ownershipTypes', value: next });
                    }} />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="filter-group">
            <button type="button" className="filter-group-title" onClick={() => dispatch({ type: 'TOGGLE_GROUP', group: 'hub' })}>
              <span>Hub & Station</span>
              <span>{state.sidebarOpen.hub ? '▾' : '▸'}</span>
            </button>
            {state.sidebarOpen.hub && (
              <div className="filter-group-body">
                <div className="filter-section">
                  <label>Hub Name</label>
                  <select multiple value={state.filters.hubNames} onChange={(e) => dispatch({ type: 'SET_FILTER', key: 'hubNames', value: Array.from(e.target.selectedOptions).map((opt) => opt.value) })}>
                    {Array.from(new Set(routes.map((route) => route.hubName))).sort().map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
                <div className="filter-row wrap">
                  {HUB_TYPES.map((label) => (
                    <FilterChip key={label} label={label} selected={state.filters.hubTypes.includes(label)} onClick={() => {
                      const next = state.filters.hubTypes.includes(label) ? state.filters.hubTypes.filter((value) => value !== label) : [...state.filters.hubTypes, label];
                      dispatch({ type: 'SET_FILTER', key: 'hubTypes', value: next });
                    }} />
                  ))}
                </div>
                <div className="filter-row wrap">
                  {HUB_STATUS.map((label) => (
                    <FilterChip key={label} label={label} selected={state.filters.hubStatuses.includes(label)} onClick={() => {
                      const next = state.filters.hubStatuses.includes(label) ? state.filters.hubStatuses.filter((value) => value !== label) : [...state.filters.hubStatuses, label];
                      dispatch({ type: 'SET_FILTER', key: 'hubStatuses', value: next });
                    }} />
                  ))}
                </div>
                <div className="filter-row wrap">
                  {HUB_TIERS.map((label) => (
                    <FilterChip key={label} label={label} selected={state.filters.hubTiers.includes(label)} onClick={() => {
                      const next = state.filters.hubTiers.includes(label) ? state.filters.hubTiers.filter((value) => value !== label) : [...state.filters.hubTiers, label];
                      dispatch({ type: 'SET_FILTER', key: 'hubTiers', value: next });
                    }} />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="filter-group">
            <button type="button" className="filter-group-title" onClick={() => dispatch({ type: 'TOGGLE_GROUP', group: 'capacity' })}>
              <span>Capacity Status</span>
              <span>{state.sidebarOpen.capacity ? '▾' : '▸'}</span>
            </button>
            {state.sidebarOpen.capacity && (
              <div className="filter-group-body">
                <div className="filter-row wrap">
                  {UTILIZATION_BANDS.map((label) => (
                    <FilterChip key={label} label={label} selected={state.filters.utilizationBands.includes(label)} onClick={() => {
                      const next = state.filters.utilizationBands.includes(label) ? state.filters.utilizationBands.filter((value) => value !== label) : [...state.filters.utilizationBands, label];
                      dispatch({ type: 'SET_FILTER', key: 'utilizationBands', value: next });
                    }} />
                  ))}
                </div>
                <div className="filter-row wrap">
                  {CAPACITY_STATUS.map((label) => (
                    <FilterChip key={label} label={label} selected={state.filters.capacityStatuses.includes(label)} onClick={() => {
                      const next = state.filters.capacityStatuses.includes(label) ? state.filters.capacityStatuses.filter((value) => value !== label) : [...state.filters.capacityStatuses, label];
                      dispatch({ type: 'SET_FILTER', key: 'capacityStatuses', value: next });
                    }} />
                  ))}
                </div>
                <div className="filter-row wrap">
                  {SHORTFALL_FLAGS.map((label) => (
                    <FilterChip key={label} label={label} selected={state.filters.shortfallFlags.includes(label)} onClick={() => {
                      const next = state.filters.shortfallFlags.includes(label) ? state.filters.shortfallFlags.filter((value) => value !== label) : [...state.filters.shortfallFlags, label];
                      dispatch({ type: 'SET_FILTER', key: 'shortfallFlags', value: next });
                    }} />
                  ))}
                </div>
                <div className="filter-row wrap">
                  {CONFIRMED_STATUS.map((label) => (
                    <FilterChip key={label} label={label} selected={state.filters.confirmedStatuses.includes(label)} onClick={() => {
                      const next = state.filters.confirmedStatuses.includes(label) ? state.filters.confirmedStatuses.filter((value) => value !== label) : [...state.filters.confirmedStatuses, label];
                      dispatch({ type: 'SET_FILTER', key: 'confirmedStatuses', value: next });
                    }} />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="filter-group">
            <button type="button" className="filter-group-title" onClick={() => dispatch({ type: 'TOGGLE_GROUP', group: 'sla' })}>
              <span>SLA & Service</span>
              <span>{state.sidebarOpen.sla ? '▾' : '▸'}</span>
            </button>
            {state.sidebarOpen.sla && (
              <div className="filter-group-body">
                <div className="filter-row wrap">
                  {SLA_TYPES.map((label) => (
                    <FilterChip key={label} label={label} selected={state.filters.slaTypes.includes(label)} onClick={() => {
                      const next = state.filters.slaTypes.includes(label) ? state.filters.slaTypes.filter((value) => value !== label) : [...state.filters.slaTypes, label];
                      dispatch({ type: 'SET_FILTER', key: 'slaTypes', value: next });
                    }} />
                  ))}
                </div>
                <div className="filter-row wrap">
                  {SLA_STATUS.map((label) => (
                    <FilterChip key={label} label={label} selected={state.filters.slaStatuses.includes(label)} onClick={() => {
                      const next = state.filters.slaStatuses.includes(label) ? state.filters.slaStatuses.filter((value) => value !== label) : [...state.filters.slaStatuses, label];
                      dispatch({ type: 'SET_FILTER', key: 'slaStatuses', value: next });
                    }} />
                  ))}
                </div>
                <div className="filter-row wrap">
                  {PRIORITIES.map((label) => (
                    <FilterChip key={label} label={label} selected={state.filters.priorities.includes(label)} onClick={() => {
                      const next = state.filters.priorities.includes(label) ? state.filters.priorities.filter((value) => value !== label) : [...state.filters.priorities, label];
                      dispatch({ type: 'SET_FILTER', key: 'priorities', value: next });
                    }} />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="filter-group">
            <button type="button" className="filter-group-title" onClick={() => dispatch({ type: 'TOGGLE_GROUP', group: 'external' })}>
              <span>External Flags</span>
              <span>{state.sidebarOpen.external ? '▾' : '▸'}</span>
            </button>
            {state.sidebarOpen.external && (
              <div className="filter-group-body">
                <div className="filter-row wrap">
                  {WEATHER_ALERTS.map((label) => (
                    <FilterChip key={label} label={label} selected={state.filters.weatherAlerts.includes(label)} onClick={() => {
                      const next = state.filters.weatherAlerts.includes(label) ? state.filters.weatherAlerts.filter((value) => value !== label) : [...state.filters.weatherAlerts, label];
                      dispatch({ type: 'SET_FILTER', key: 'weatherAlerts', value: next });
                    }} />
                  ))}
                </div>
                <div className="filter-row wrap">
                  {OPERATIONAL_FLAGS.map((label) => (
                    <FilterChip key={label} label={label} selected={state.filters.operationalFlags.includes(label)} onClick={() => {
                      const next = state.filters.operationalFlags.includes(label) ? state.filters.operationalFlags.filter((value) => value !== label) : [...state.filters.operationalFlags, label];
                      dispatch({ type: 'SET_FILTER', key: 'operationalFlags', value: next });
                    }} />
                  ))}
                </div>
                <div className="filter-row wrap">
                  <FilterChip label="Festival" selected={state.filters.festivalFlag === true} onClick={() => dispatch({ type: 'SET_FILTER', key: 'festivalFlag', value: state.filters.festivalFlag === true ? null : true })} />
                  <FilterChip label="No Festival" selected={state.filters.festivalFlag === false} onClick={() => dispatch({ type: 'SET_FILTER', key: 'festivalFlag', value: state.filters.festivalFlag === false ? null : false })} />
                </div>
              </div>
            )}
          </div>

          <div className="filter-footer">
            <button type="button" className="btn btn--primary" onClick={() => dispatch({ type: 'APPLY_FILTERS' })}>Apply Filters</button>
            <button type="button" className="btn btn--ghost" onClick={() => dispatch({ type: 'RESET_FILTERS' })}>Reset All</button>
          </div>
        </aside>

        <main className="route-main-panel">
          <div className="breadcrumb-panel card">
            <div className="breadcrumb-row">
              {state.breadcrumbPath.map((item, index) => (
                <button key={`${item.label}-${index}`} type="button" className="breadcrumb-item" onClick={() => handleBreadcrumbClick(index)}>{item.label}</button>
              ))}
            </div>
          </div>

          <div className="metric-cards-row">
            <div className="metric-card metric-card--blue">
              <div className="metric-label">Total Capacity</div>
              <div className="metric-value">{searchRows.totalCapacity}</div>
              <div className="metric-sub">available on selected scope</div>
            </div>
            <div className="metric-card metric-card--green">
              <div className="metric-label">Utilized</div>
              <div className="metric-value">{searchRows.utilized}</div>
              <div className="metric-sub">{searchRows.totalCapacity !== '0' ? `${((Number(searchRows.utilized.replace(/,/g, '')) / Number(searchRows.totalCapacity.replace(/,/g, ''))) * 100).toFixed(1)}% utilized` : '0.0% utilized'}</div>
            </div>
            <div className="metric-card metric-card--teal">
              <div className="metric-label">Available Slots</div>
              <div className="metric-value">{searchRows.available}</div>
              <div className="metric-sub">remaining today</div>
            </div>
            <div className="metric-card metric-card--purple">
              <div className="metric-label">Active Routes</div>
              <div className="metric-value">{searchRows.activeRoutes}</div>
              <div className="metric-sub">coverage in scope</div>
            </div>
            <div className="metric-card metric-card--yellow">
              <div className="metric-label">Active Partners</div>
              <div className="metric-value">{searchRows.activePartners}</div>
              <div className="metric-sub">partners engaged</div>
            </div>
            <div className="metric-card metric-card--grass">
              <div className="metric-label">Fleet Available</div>
              <div className="metric-value">{searchRows.fleetAvailable}</div>
              <div className="metric-sub">vehicles ready</div>
            </div>
            <div className="metric-card metric-card--red">
              <div className="metric-label">Shortfall Routes</div>
              <div className="metric-value">{searchRows.shortfallRoutes}</div>
              <div className="metric-sub">flagged routes</div>
            </div>
            <div className="metric-card metric-card--indigo">
              <div className="metric-label">Avg Utilization %</div>
              <div className="metric-value">{searchRows.avgUtilization}</div>
              <div className="metric-sub">across filtered routes</div>
            </div>
          </div>

          <div className="table-toolbar-row">
            <div className="table-title">Route Capacity Intelligence</div>
            <div className="table-actions">
              <button type="button" className="btn btn--ghost" onClick={() => setShowColumnPicker((visible) => !visible)}>Columns ▼</button>
              <button type="button" className="btn btn--secondary">Download CSV</button>
            </div>
          </div>

          {showColumnPicker && (
            <div className="column-picker card">
              {COLUMN_GROUPS.map((group) => (
                <div key={group.key} className="column-picker-group">
                  <div className="column-picker-group-label">{group.title}</div>
                  <div className="column-picker-group-list">
                    {group.columns.map((column) => (
                      <label key={column.key} className="column-toggle">
                        <input type="checkbox" checked={state.columns[column.key]} onChange={() => dispatch({ type: 'TOGGLE_COLUMN', column: column.key })} />
                        {column.label}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="route-table-wrapper card">
            <div className="route-table-header">
              <div className="route-table-cell route-table-cell--main">Origin → Destination</div>
              <div className="route-table-cell">Route Type</div>
              {state.columns.totalCapacity && <div className="route-table-cell">Total Capacity</div>}
              {state.columns.utilized && <div className="route-table-cell">Utilized</div>}
              {state.columns.available && <div className="route-table-cell">Available</div>}
              {state.columns.utilPercent && <div className="route-table-cell">Util %</div>}
              {state.columns.partnersActive && <div className="route-table-cell">Partners</div>}
              {state.columns.topPartner && <div className="route-table-cell">Top Partner</div>}
              {state.columns.mode && <div className="route-table-cell">Mode</div>}
              {state.columns.vehicleType && <div className="route-table-cell">Vehicle</div>}
              {state.columns.fleetAssigned && <div className="route-table-cell">Assigned</div>}
              {state.columns.fleetAvailable && <div className="route-table-cell">Available</div>}
              {state.columns.departuresToday && <div className="route-table-cell">Departures</div>}
              {state.columns.slaType && <div className="route-table-cell">SLA</div>}
            </div>
            <div className="route-table-body">
              {pageRows.map((row) => (
                <div key={row.routeId} className="route-table-row-wrapper">
                  <RouteRow
                    row={row}
                    expanded={state.expandedRows.includes(row.routeId)}
                    onSelect={() => handleRowClick(row)}
                    onExpand={() => dispatch({ type: 'SET_EXPANDED_ROW', routeId: row.routeId })}
                  />
                  {state.expandedRows.includes(row.routeId) && selectedRoute && selectedRoute.routeId === row.routeId && (
                    <div className="expanded-partner-panel">
                      <div className="expanded-partner-title">Top partner mix</div>
                      <div className="partner-grid">
                        {selectedRoute.partners.map((partner) => (
                          <div key={partner.name} className="partner-card">
                            <div className="partner-name">{partner.name}</div>
                            <div className="partner-metric">Util {partner.utilPercent}%</div>
                            <div className="partner-metric">Avail {partner.available}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="route-table-total card route-table-footer">
              <div className="route-table-cell route-table-cell--main">Totals</div>
              <div className="route-table-cell">—</div>
              {state.columns.totalCapacity && <div className="route-table-cell">{totals.totalCapacity.toLocaleString()}</div>}
              {state.columns.utilized && <div className="route-table-cell">{totals.utilized.toLocaleString()}</div>}
              {state.columns.available && <div className="route-table-cell">{totals.available.toLocaleString()}</div>}
              {state.columns.utilPercent && <div className="route-table-cell">—</div>}
              {state.columns.partnersActive && <div className="route-table-cell">—</div>}
              {state.columns.topPartner && <div className="route-table-cell">—</div>}
              {state.columns.mode && <div className="route-table-cell">—</div>}
              {state.columns.vehicleType && <div className="route-table-cell">—</div>}
              {state.columns.fleetAssigned && <div className="route-table-cell">—</div>}
              {state.columns.fleetAvailable && <div className="route-table-cell">—</div>}
              {state.columns.departuresToday && <div className="route-table-cell">—</div>}
              {state.columns.slaType && <div className="route-table-cell">—</div>}
            </div>
          </div>

          <div className="table-footer-row">
            <div className="pagination-summary">Page {state.page} of {pageCount}</div>
            <div className="page-controls">
              <label>
                Rows
                <select value={state.pageSize} onChange={(e) => dispatch({ type: 'SET_PAGE_SIZE', pageSize: Number(e.target.value) })}>
                  {[25, 50, 100].map((size) => (<option key={size} value={size}>{size}</option>))}
                </select>
              </label>
              <button type="button" className="btn btn--ghost" disabled={state.page === 1} onClick={() => dispatch({ type: 'SET_PAGE', page: Math.max(1, state.page - 1) })}>Prev</button>
              <button type="button" className="btn btn--ghost" disabled={state.page === pageCount} onClick={() => dispatch({ type: 'SET_PAGE', page: Math.min(pageCount, state.page + 1) })}>Next</button>
            </div>
          </div>
        </main>

        <aside className="route-map-panel card">
          <div className="map-panel-header">
            <div>
              <div className="metric-label">India Capacity Map</div>
              <div className="metric-sub">Selected geography and route arc</div>
            </div>
          </div>
          <div className="map-canvas">
            <svg viewBox="0 0 700 700" className="india-map-svg">
              <rect x="40" y="40" width="620" height="620" rx="24" fill="#08111F" stroke="#1A2535" strokeWidth="2" />
              {ZONE_OPTIONS.map((zone, index) => {
                const x = 60 + (index % 2) * 280;
                const y = 80 + Math.floor(index / 2) * 220;
                return (
                  <g key={zone}>
                    <rect x={x} y={y} width="240" height="150" rx="16" fill={state.breadcrumbPath.some((item) => item.value === zone) ? 'rgba(0,212,255,0.16)' : 'rgba(255,255,255,0.03)'} stroke="#16314A" />
                    <text x={x + 18} y={y + 28} fill="#E8F4FF" fontSize="12" fontWeight="700">{zone} Zone</text>
                  </g>
                );
              })}
              {Object.entries(CITY_POSITIONS).map(([city, pos]) => (
                <g key={city} transform={`translate(${pos.x}, ${pos.y})`}>
                  <circle cx="0" cy="0" r="8" fill="#00D4FF" stroke="#08111F" strokeWidth="2" />
                  <text x="12" y="4" fill="#E8F4FF" fontSize="10">{city}</text>
                </g>
              ))}
              {selectedRoute && CITY_POSITIONS[selectedRoute.originCity] && CITY_POSITIONS[selectedRoute.destCity] && (
                <path d={`M${CITY_POSITIONS[selectedRoute.originCity].x} ${CITY_POSITIONS[selectedRoute.originCity].y} C ${CITY_POSITIONS[selectedRoute.originCity].x + 80} ${CITY_POSITIONS[selectedRoute.originCity].y - 80}, ${CITY_POSITIONS[selectedRoute.destCity].x - 80} ${CITY_POSITIONS[selectedRoute.destCity].y + 80}, ${CITY_POSITIONS[selectedRoute.destCity].x} ${CITY_POSITIONS[selectedRoute.destCity].y}`} fill="none" stroke="#00D4FF" strokeWidth="3" strokeLinecap="round" strokeDasharray="8 6" />
              )}
            </svg>
          </div>
          <div className="route-quick-stats card">
            <div className="route-quick-header">
              <h4>{selectedRoute ? `${selectedRoute.originCity} → ${selectedRoute.destCity}` : 'No route selected'}</h4>
              <span>{selectedRoute ? selectedRoute.routeType : 'Select a route to view details'}</span>
            </div>
            {selectedRouteStats && (
              <>
                <div className="route-quick-section">
                  <div className="metric-label">Top Partners</div>
                  {selectedRouteStats.topPartners.map((partner) => (
                    <div key={partner.name} className="partner-bar">
                      <span>{partner.name}</span>
                      <div className="partner-bar-track"><div className="partner-bar-fill" style={{ width: `${partner.utilPercent}%` }} /></div>
                      <span>{partner.utilPercent}%</span>
                    </div>
                  ))}
                </div>
                <div className="route-quick-section">
                  <div className="metric-label">Mode Split</div>
                  {selectedRouteStats.modeCounts.filter((item) => item.value > 0).map((item) => (
                    <div key={item.mode} className="mode-bar-item">
                      <span>{item.mode}</span>
                      <div className="mode-bar-track"><div className="mode-bar-fill" style={{ width: `${item.value * 100}%` }} /></div>
                    </div>
                  ))}
                </div>
                <div className="route-quick-section">
                  <div className="metric-label">Departure timeline</div>
                  {selectedRouteStats.departures.map((slot) => (
                    <div key={slot.slot} className="timeline-row">
                      <span>{slot.slot}</span>
                      <div className="timeline-track"><div className="timeline-fill" style={{ width: `${Math.min(100, Math.max(14, (slot.available / slot.capacity) * 100))}%` }} /></div>
                      <span>{slot.available}/{slot.capacity}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
