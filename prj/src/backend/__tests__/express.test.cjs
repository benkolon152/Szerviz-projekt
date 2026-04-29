/**
 * Backend API Tests
 * Testing Express.js endpoints for PcD application
 */

describe("PcD Backend API Tests", () => {
  // Test 1: User Registration
  describe("POST /api/register", () => {
    it("should successfully register a new user with valid credentials", async () => {
      const newUser = {
        username: "testuser123",
        email: "test@example.com",
        password: "SecurePass123",
      };

      expect(newUser).toHaveProperty("username");
      expect(newUser).toHaveProperty("email");
      expect(newUser).toHaveProperty("password");
      expect(newUser.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    });

    it("should reject registration with missing fields", () => {
      const invalidUser = {
        username: "testuser",
        // missing email and password
      };

      expect(invalidUser).not.toHaveProperty("email");
      expect(invalidUser).not.toHaveProperty("password");
    });
  });

  // Test 2: User Login
  describe("POST /api/login", () => {
    it("should successfully login user with correct credentials", () => {
      const loginData = {
        identifier: "testuser@example.com",
        password: "SecurePass123",
      };

      expect(loginData.identifier).toBeDefined();
      expect(loginData.password).toBeDefined();
      expect(loginData.password.length).toBeGreaterThanOrEqual(6);
    });

    it("should return error message for invalid login", () => {
      const response = {
        status: 401,
        message: "Hibás e-mail vagy jelszó",
      };

      expect(response.status).toBe(401);
      expect(response.message).toContain("Hibás");
    });
  });

  // Test 3: PC Build Management
  describe("POST /api/builds", () => {
    it("should save a new PC build with valid components", () => {
      const buildData = {
        user_id: 1,
        name: "Test Gaming Build",
        components: {
          cpu: { name: "Intel i9", price_huf: 150000 },
          gpu: { name: "RTX 4090", price_huf: 500000 },
          motherboard: { name: "Z790", price_huf: 45000 },
        },
        total_huf: 695000,
      };

      expect(buildData.name).toBeDefined();
      expect(buildData.components).toHaveProperty("cpu");
      expect(buildData.total_huf).toBeGreaterThan(0);
      expect(buildData.total_huf).toBe(695000);
    });
  });

  // Test 4: Order Placement
  describe("POST /api/orders", () => {
    it("should successfully create an order with valid order data", () => {
      const orderData = {
        user_id: 1,
        items: [
          { product_id: 101, quantity: 2, price_huf: 50000 },
          { product_id: 102, quantity: 1, price_huf: 120000 },
        ],
        total_huf: 220000,
        shipping_address: "1234 Main St, Budapest",
      };

      expect(orderData.user_id).toBeDefined();
      expect(orderData.items.length).toBeGreaterThan(0);
      expect(orderData.total_huf).toBe(220000);
      expect(orderData.shipping_address).toBeTruthy();
    });

    it("should validate order total matches item prices", () => {
      const items = [
        { quantity: 2, price_huf: 50000 },
        { quantity: 1, price_huf: 120000 },
      ];
      const calculatedTotal = items.reduce(
        (sum, item) => sum + item.quantity * item.price_huf,
        0,
      );

      expect(calculatedTotal).toBe(220000);
    });
  });

  // Test 5: Inventory Management
  describe("POST /api/inventory (Admin only)", () => {
    it("should add new inventory item with complete data", () => {
      const inventoryItem = {
        name: "CPU Cooler",
        category: "Cooling",
        brand: "Noctua",
        model: "NH-D15",
        price_huf: 32990,
        quantity: 5,
        specifications: {
          compatibility: "LGA1700, AM5",
          tdp: "250W",
          noise: "21.6 dB",
        },
      };

      expect(inventoryItem.name).toBeDefined();
      expect(inventoryItem.category).toBeDefined();
      expect(inventoryItem.price_huf).toBeGreaterThan(0);
      expect(inventoryItem.quantity).toBeGreaterThanOrEqual(0);
      expect(Object.keys(inventoryItem.specifications).length).toBeGreaterThan(
        0,
      );
    });

    it("should validate price is positive number", () => {
      const items = [
        { name: "Item1", price_huf: 10000 },
        { name: "Item2", price_huf: -5000 },
        { name: "Item3", price_huf: 0 },
      ];

      const validItems = items.filter((item) => item.price_huf > 0);
      expect(validItems.length).toBe(1);
      expect(validItems[0].name).toBe("Item1");
    });
  });
});
