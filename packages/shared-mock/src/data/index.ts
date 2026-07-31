import type { IStore, IUser, IDevice, ISession, IOrder, IBrand, IModel } from '@dobara/utils';

export const brands: IBrand[] = [
  { id: 'apple', name: 'Apple' },
  { id: 'samsung', name: 'Samsung' },
  { id: 'xiaomi', name: 'Xiaomi' },
  { id: 'oneplus', name: 'OnePlus' },
  { id: 'oppo', name: 'OPPO' },
];

export const models: IModel[] = [
  { id: 'iphone12', brandId: 'apple', name: 'iPhone 12', releaseYear: 2020, colors: ['Black', 'White', 'Blue', 'Green', 'Red'], storageOptions: ['64GB', '128GB', '256GB'], specs: { processor: 'A14 Bionic (6-core)', ram: '4GB', display: '6.1" OLED, 2532×1170, 60Hz', rearCamera: '12MP Wide + 12MP Ultra Wide, f/1.6', frontCamera: '12MP, f/2.2', battery: '2815mAh, 20W Wired', os: 'iOS 14 → iOS 18', dimensions: '146.7×71.5×7.4mm, 164g', connectivity: '5G, Wi-Fi 6, Bluetooth 5.0', security: 'Face ID', waterproof: 'IP68', simSlot: 'Dual (nano-SIM + eSIM)' } },
  { id: 'iphone13', brandId: 'apple', name: 'iPhone 13', releaseYear: 2021, colors: ['Midnight', 'Starlight', 'Blue', 'Pink', 'Red'], storageOptions: ['128GB', '256GB', '512GB'], specs: { processor: 'A15 Bionic (6-core)', ram: '4GB', display: '6.1" OLED, 2532×1170, 60Hz', rearCamera: '12MP Wide + 12MP Ultra Wide, f/1.6', frontCamera: '12MP, f/2.2', battery: '3240mAh, 20W Wired', os: 'iOS 15 → iOS 18', dimensions: '146.7×71.5×7.7mm, 174g', connectivity: '5G, Wi-Fi 6, Bluetooth 5.0', security: 'Face ID', waterproof: 'IP68', simSlot: 'Dual (nano-SIM + eSIM)' } },
  { id: 'iphone14', brandId: 'apple', name: 'iPhone 14', releaseYear: 2022, colors: ['Midnight', 'Starlight', 'Blue', 'Purple', 'Red'], storageOptions: ['128GB', '256GB', '512GB'], specs: { processor: 'A15 Bionic (5-core GPU)', ram: '6GB', display: '6.1" OLED, 2532×1170, 60Hz', rearCamera: '12MP Wide + 12MP Ultra Wide, f/1.5', frontCamera: '12MP, f/1.9', battery: '3279mAh, 20W Wired', os: 'iOS 16 → iOS 18', dimensions: '146.7×71.5×7.8mm, 172g', connectivity: '5G, Wi-Fi 6, Bluetooth 5.3', security: 'Face ID', waterproof: 'IP68', simSlot: 'Dual (nano-SIM + eSIM)' } },
  { id: 'galaxys21', brandId: 'samsung', name: 'Galaxy S21', releaseYear: 2021, colors: ['Phantom Gray', 'Phantom White', 'Phantom Violet'], storageOptions: ['128GB', '256GB'], specs: { processor: 'Exynos 2100 (8-core)', ram: '8GB', display: '6.2" AMOLED, 2400×1080, 120Hz', rearCamera: '12MP Wide + 12MP Ultra Wide + 64MP Telephoto', frontCamera: '10MP, f/2.2', battery: '4000mAh, 25W Wired', os: 'Android 11 → 14', dimensions: '151.7×71.2×7.9mm, 169g', connectivity: '5G, Wi-Fi 6, Bluetooth 5.1', security: 'Ultrasonic Fingerprint', waterproof: 'IP68', simSlot: 'Dual (nano-SIM)' } },
  { id: 'galaxys22', brandId: 'samsung', name: 'Galaxy S22', releaseYear: 2022, colors: ['Phantom Black', 'Phantom White', 'Green', 'Burgundy'], storageOptions: ['128GB', '256GB'], specs: { processor: 'Snapdragon 8 Gen 1 (8-core)', ram: '8GB', display: '6.1" AMOLED, 2340×1080, 120Hz', rearCamera: '50MP Wide + 12MP Ultra Wide + 10MP Telephoto', frontCamera: '10MP, f/2.2', battery: '3700mAh, 25W Wired', os: 'Android 12 → 14', dimensions: '146×70.6×7.6mm, 167g', connectivity: '5G, Wi-Fi 6E, Bluetooth 5.2', security: 'Ultrasonic Fingerprint', waterproof: 'IP68', simSlot: 'Dual (nano-SIM)' } },
  { id: 'mi11', brandId: 'xiaomi', name: 'Mi 11', releaseYear: 2021, colors: ['Midnight Gray', 'Horizon Blue'], storageOptions: ['128GB', '256GB'], specs: { processor: 'Snapdragon 888 (8-core)', ram: '8GB', display: '6.81" AMOLED, 3200×1440, 120Hz', rearCamera: '108MP Wide + 13MP Ultra Wide + 5MP Macro', frontCamera: '20MP, f/2.2', battery: '4600mAh, 55W Wired', os: 'Android 11 → 13', dimensions: '164.3×74.6×8.1mm, 196g', connectivity: '5G, Wi-Fi 6, Bluetooth 5.2', security: 'In-display Fingerprint', waterproof: 'No', simSlot: 'Dual (nano-SIM)' } },
  { id: 'nord2', brandId: 'oneplus', name: 'Nord 2', releaseYear: 2021, colors: ['Gray Sierra', 'Blue Haze', 'Green Wood'], storageOptions: ['128GB', '256GB'], specs: { processor: 'Dimensity 1200-AI (8-core)', ram: '8GB', display: '6.43" AMOLED, 2400×1080, 90Hz', rearCamera: '50MP Wide + 8MP Ultra Wide + 2MP Depth', frontCamera: '32MP, f/2.5', battery: '4500mAh, 65W Wired', os: 'Android 11 → 13', dimensions: '159.1×73.3×8.3mm, 189g', connectivity: '5G, Wi-Fi 6, Bluetooth 5.2', security: 'In-display Fingerprint', waterproof: 'No', simSlot: 'Dual (nano-SIM)' } },
  { id: 'reno6', brandId: 'oppo', name: 'Reno 6', releaseYear: 2021, colors: ['Aurora', 'Stellar Black'], storageOptions: ['128GB'], specs: { processor: 'Dimensity 900 (8-core)', ram: '8GB', display: '6.43" AMOLED, 2400×1080, 90Hz', rearCamera: '64MP Wide + 8MP Ultra Wide + 2MP Macro', frontCamera: '32MP, f/2.4', battery: '4300mAh, 65W Wired', os: 'Android 11 → 13', dimensions: '156.8×72.1×7.6mm, 182g', connectivity: '5G, Wi-Fi 6, Bluetooth 5.2', security: 'In-display Fingerprint', waterproof: 'No', simSlot: 'Dual (nano-SIM)' } },
];

function genImei(base: number) {
  const s = String(350000000000000 + base);
  return s.substring(0, 15);
}

export const devices: IDevice[] = [
  { imei: genImei(1), brandId: 'apple', modelId: 'iphone13', grade: 'A', color: 'Midnight', storage: '128GB', status: 'available', price: 42000, originalPrice: 38000, city: 'Mumbai', warehouseId: 'wh-mum' },
  { imei: genImei(2), brandId: 'apple', modelId: 'iphone13', grade: 'B', color: 'Blue', storage: '256GB', status: 'available', price: 38000, originalPrice: 34000, city: 'Delhi', warehouseId: 'wh-del' },
  { imei: genImei(3), brandId: 'apple', modelId: 'iphone12', grade: 'A', color: 'White', storage: '128GB', status: 'available', price: 32000, originalPrice: 29000, city: 'Mumbai', warehouseId: 'wh-mum' },
  { imei: genImei(4), brandId: 'apple', modelId: 'iphone12', grade: 'C', color: 'Black', storage: '64GB', status: 'available', price: 22000, originalPrice: 19000, city: 'Bangalore', warehouseId: 'wh-blr' },
  { imei: genImei(5), brandId: 'apple', modelId: 'iphone14', grade: 'A', color: 'Purple', storage: '128GB', status: 'available', price: 55000, originalPrice: 50000, city: 'Mumbai', warehouseId: 'wh-mum' },
  { imei: genImei(6), brandId: 'apple', modelId: 'iphone14', grade: 'B', color: 'Midnight', storage: '256GB', status: 'available', price: 48000, originalPrice: 44000, city: 'Delhi', warehouseId: 'wh-del' },
  { imei: genImei(7), brandId: 'samsung', modelId: 'galaxys22', grade: 'A', color: 'Phantom Black', storage: '128GB', status: 'available', price: 40000, originalPrice: 36000, city: 'Mumbai', warehouseId: 'wh-mum' },
  { imei: genImei(8), brandId: 'samsung', modelId: 'galaxys21', grade: 'B', color: 'Phantom Violet', storage: '256GB', status: 'available', price: 25000, originalPrice: 22000, city: 'Delhi', warehouseId: 'wh-del' },
  { imei: genImei(9), brandId: 'samsung', modelId: 'galaxys22', grade: 'C', color: 'Green', storage: '128GB', status: 'available', price: 28000, originalPrice: 24000, city: 'Bangalore', warehouseId: 'wh-blr' },
  { imei: genImei(10), brandId: 'xiaomi', modelId: 'mi11', grade: 'A', color: 'Midnight Gray', storage: '256GB', status: 'available', price: 22000, originalPrice: 19000, city: 'Mumbai', warehouseId: 'wh-mum' },
  { imei: genImei(11), brandId: 'xiaomi', modelId: 'mi11', grade: 'B', color: 'Horizon Blue', storage: '128GB', status: 'available', price: 18000, originalPrice: 16000, city: 'Delhi', warehouseId: 'wh-del' },
  { imei: genImei(12), brandId: 'oneplus', modelId: 'nord2', grade: 'A', color: 'Blue Haze', storage: '256GB', status: 'available', price: 20000, originalPrice: 18000, city: 'Mumbai', warehouseId: 'wh-mum' },
  { imei: genImei(13), brandId: 'oneplus', modelId: 'nord2', grade: 'B', color: 'Gray Sierra', storage: '128GB', status: 'available', price: 16000, originalPrice: 14000, city: 'Bangalore', warehouseId: 'wh-blr' },
  { imei: genImei(14), brandId: 'oppo', modelId: 'reno6', grade: 'A', color: 'Aurora', storage: '128GB', status: 'available', price: 18000, originalPrice: 16000, city: 'Delhi', warehouseId: 'wh-del' },
  { imei: genImei(15), brandId: 'oppo', modelId: 'reno6', grade: 'C', color: 'Stellar Black', storage: '128GB', status: 'available', price: 12000, originalPrice: 10000, city: 'Mumbai', warehouseId: 'wh-mum' },
  { imei: genImei(16), brandId: 'apple', modelId: 'iphone13', grade: 'D', color: 'Starlight', storage: '128GB', status: 'pending_review', price: 26000, originalPrice: 22000, city: 'Mumbai', warehouseId: 'wh-mum' },
  { imei: genImei(17), brandId: 'apple', modelId: 'iphone12', grade: 'B', color: 'Red', storage: '128GB', status: 'pending_review', price: 26000, originalPrice: 23000, city: 'Delhi', warehouseId: 'wh-del' },
  { imei: genImei(18), brandId: 'samsung', modelId: 'galaxys21', grade: 'A', color: 'Phantom Gray', storage: '128GB', status: 'locked', price: 30000, originalPrice: 27000, city: 'Mumbai', warehouseId: 'wh-mum' },
  { imei: genImei(19), brandId: 'xiaomi', modelId: 'mi11', grade: 'D', color: 'Midnight Gray', storage: '128GB', status: 'pending_review', price: 12000, originalPrice: 10000, city: 'Bangalore', warehouseId: 'wh-blr' },
  { imei: genImei(20), brandId: 'samsung', modelId: 'galaxys22', grade: 'B', color: 'Burgundy', storage: '256GB', status: 'available', price: 35000, originalPrice: 31000, city: 'Delhi', warehouseId: 'wh-del' },
];

export const stores: IStore[] = [
  { id: 'st-mum-1', name: 'MobileXchange Andheri', city: 'Mumbai', address: 'Andheri West, Mumbai 400058', phone: '+91-9876543201' },
  { id: 'st-del-1', name: 'GadgetMart CP', city: 'Delhi', address: 'Connaught Place, New Delhi 110001', phone: '+91-9876543202' },
  { id: 'st-blr-1', name: 'Fonfix Koramangala', city: 'Bangalore', address: 'Koramangala 5th Block, Bangalore 560095', phone: '+91-9876543203' },
];

export const users: IUser[] = [
  { id: 'u-1', phone: '+919876543201', name: 'Rahul Sharma', role: 'consumer' },
  { id: 'u-2', phone: '+919876543202', name: 'Priya Patel', role: 'consumer' },
  { id: 'u-3', phone: '+919876543203', name: 'Amit Singh', role: 'clerk', storeId: 'st-mum-1' },
  { id: 'u-4', phone: '+919876543204', name: 'Vikram Rao', role: 'store_owner', storeId: 'st-mum-1' },
  { id: 'u-5', phone: '+919876543205', name: 'Neha Gupta', role: 'ops' },
  { id: 'u-6', phone: '+919876543206', name: 'Admin User', role: 'admin' },
  { id: 'u-7', phone: '+919876543207', name: 'Rajesh Kumar', role: 'wh_manager' },
  { id: 'u-8', phone: '+919876543208', name: 'Sunita Verma', role: 'finance' },
];

// Compute available devices
export const getAvailableDevices = () => {
  return devices.filter((d) => d.status === 'available');
};

export const getDeviceById = (imei: string) => {
  return devices.find((d) => d.imei === imei);
};

export const getModelById = (id: string) => models.find((m) => m.id === id);
export const getBrandById = (id: string) => brands.find((b) => b.id === id);
export const getStoreById = (id: string) => stores.find((s) => s.id === id);
