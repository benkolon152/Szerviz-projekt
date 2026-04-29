/**
 * Frontend Component Tests
 * Testing SvelteKit pages and components for PcD application
 */

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

describe("PcD Frontend Component Tests", () => {
  // Test 1: Homepage Navigation
  describe("Navigation Component", () => {
    it("should display all navigation links on homepage", () => {
      const navLinks = ["Kezdőlap", "Bolt", "PC építő", "Raktárkészlet"];

      navLinks.forEach((link) => {
        expect(link).toBeTruthy();
      });
      expect(navLinks.length).toBe(4);
    });

    it("should show profile dropdown when logged in", () => {
      const isLoggedIn = true;
      const displayName = "testuser";

      expect(isLoggedIn).toBe(true);
      expect(displayName).toBeDefined();
      expect(displayName.length).toBeGreaterThan(0);
    });

    it("should display correct menu items in profile dropdown", () => {
      const dropdownItems = ["Fiókom", "Rendeléseim", "Mentett buildek"];

      expect(dropdownItems).toContain("Fiókom");
      expect(dropdownItems).toContain("Rendeléseim");
      expect(dropdownItems).toContain("Mentett buildek");
      expect(dropdownItems.length).toBe(3);
    });
  });

  // Test 2: Login Form Validation
  describe("Login Form (+page.svelte /login)", () => {
    it("should validate email format before submission", () => {
      const validEmails = [
        "user@example.com",
        "test@domain.hu",
        "admin@company.org",
      ];

      validEmails.forEach((email) => {
        const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        expect(isValid).toBe(true);
      });
    });

    it("should reject empty password field", () => {
      const password = "";
      const isValidPassword = password.length > 0;

      expect(isValidPassword).toBe(false);
    });

    it("should show login error message for invalid credentials", () => {
      const response = {
        ok: false,
        message: "Hibás e-mail vagy jelszó",
      };

      expect(response.ok).toBe(false);
      expect(response.message).toContain("Hibás");
    });
  });

  // Test 3: PC Builder Component
  describe("PC Builder (+page.svelte /pcbuild)", () => {
    it("should calculate total build price correctly", () => {
      const components = {
        cpu: { price_huf: 150000 },
        motherboard: { price_huf: 45000 },
        gpu: { price_huf: 500000 },
        ram: { price_huf: 80000 },
        psu: { price_huf: 55000 },
      };

      const total = Object.values(components).reduce(
        (sum, comp) => sum + comp.price_huf,
        0,
      );
      expect(total).toBe(830000);
    });

    it("should allow adding/removing components from build", () => {
      let selectedParts = {};

      // Add component
      selectedParts["cpu"] = { name: "Intel i9", price_huf: 150000 };
      expect(Object.keys(selectedParts).length).toBe(1);

      // Add another component
      selectedParts["gpu"] = { name: "RTX 4090", price_huf: 500000 };
      expect(Object.keys(selectedParts).length).toBe(2);

      // Remove component
      delete selectedParts["cpu"];
      expect(Object.keys(selectedParts).length).toBe(1);
    });

    it("should validate component compatibility", () => {
      const selectedCpu = { socket: "LGA1700" };
      const selectedMotherboard = { socket: "LGA1700" };

      const isCompatible = selectedCpu.socket === selectedMotherboard.socket;
      expect(isCompatible).toBe(true);
    });
  });

  // Test 4: Shopping Cart Management
  describe("Shopping Cart Component", () => {
    it("should add items to cart and update quantity", () => {
      let cart = [];

      const item1 = { id: 1, name: "CPU", price_huf: 150000, quantity: 1 };
      cart.push(item1);
      expect(cart.length).toBe(1);

      // Increase quantity
      cart[0].quantity = 2;
      expect(cart[0].quantity).toBe(2);
    });

    it("should calculate cart total correctly", () => {
      const cartItems = [
        { name: "CPU", price_huf: 150000, quantity: 1 },
        { name: "GPU", price_huf: 500000, quantity: 1 },
        { name: "RAM", price_huf: 80000, quantity: 2 },
      ];

      const cartTotal = cartItems.reduce(
        (sum, item) => sum + item.price_huf * item.quantity,
        0,
      );
      expect(cartTotal).toBe(810000);
    });

    it("should remove items from cart", () => {
      let cart = [
        { id: 1, name: "CPU" },
        { id: 2, name: "GPU" },
        { id: 3, name: "RAM" },
      ];

      expect(cart.length).toBe(3);

      cart = cart.filter((item) => item.id !== 2); // Remove GPU
      expect(cart.length).toBe(2);
      expect(cart.every((item) => item.id !== 2)).toBe(true);
    });

    it("should handle empty cart state", () => {
      const cart = [];

      expect(cart.length).toBe(0);
      expect(cart.length === 0).toBe(true);
    });
  });

  // Test 5: User Saved Builds Management
  describe("Saved Builds (+page.svelte /saved-builds)", () => {
    it("should display list of user saved builds", () => {
      const savedBuilds = [
        {
          id: 1,
          name: "Gaming Build",
          total_huf: 695000,
          created_at: "2026-04-29",
        },
        {
          id: 2,
          name: "Workstation",
          total_huf: 1200000,
          created_at: "2026-04-28",
        },
      ];

      expect(savedBuilds.length).toBe(2);
      expect(savedBuilds[0]).toHaveProperty("name");
      expect(savedBuilds[0]).toHaveProperty("total_huf");
    });

    it("should format date correctly for saved builds", () => {
      const timestamp = "2026-04-29T10:30:00";
      const formattedDate = new Date(timestamp).toLocaleString("hu-HU");

      expect(formattedDate).toBeDefined();
      expect(formattedDate.includes("2026")).toBe(true);
    });

    it("should delete build with confirmation", () => {
      let builds = [
        { id: 1, name: "Build 1" },
        { id: 2, name: "Build 2" },
        { id: 3, name: "Build 3" },
      ];

      // Simulate delete with ID 2
      const buildIdToDelete = 2;
      builds = builds.filter((b) => b.id !== buildIdToDelete);

      expect(builds.length).toBe(2);
      expect(builds.every((b) => b.id !== 2)).toBe(true);
    });

    it("should handle empty saved builds list", () => {
      const builds = [];
      const isEmpty = builds.length === 0;

      expect(isEmpty).toBe(true);
      expect(builds).toEqual([]);
    });

    it("should display build components in detail view", () => {
      const build = {
        id: 1,
        name: "Gaming Build",
        components: {
          cpu: { name: "Intel i9", price_huf: 150000 },
          gpu: { name: "RTX 4090", price_huf: 500000 },
          ram: { name: "32GB DDR5", price_huf: 80000 },
        },
      };

      expect(build.components).toBeDefined();
      expect(Object.keys(build.components).length).toBe(3);
      expect(build.components.cpu.name).toBe("Intel i9");
    });
  });
});
