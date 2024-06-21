import { RouteProps, routeList } from "../navbar-utils";

describe("routeList", () => {
  it("should be an array of RouteProps", () => {
    routeList.forEach((route) => {
      expect(route).toHaveProperty("href");
      expect(route).toHaveProperty("label");

      expect(typeof route.href).toBe("string");
      expect(typeof route.label).toBe("string");
    });
  });

  it("should contain the correct routes", () => {
    const expectedRoutes: RouteProps[] = [
      { href: "#", label: "Home" },
      { href: "#about", label: "About" },
      { href: "#howItWorks", label: "How it works" },
      { href: "#contact", label: "Contact Us" },
      { href: "#faq", label: "FAQ" },
    ];

    expect(routeList).toEqual(expectedRoutes);
  });
});
