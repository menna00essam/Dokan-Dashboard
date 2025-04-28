require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./src/config/db");
const User = require("./src/models/user.model");
const { faker } = require("@faker-js/faker");
const bcrypt = require("bcryptjs");
const { ObjectId } = mongoose.Types;

// Country-specific data configuration
const countryData = {
  SA: {
    country: "Saudi Arabia",
    mobilePrefix: "05",
    provinces: [
      { id: "1", name: "Riyadh" },
      { id: "2", name: "Makkah" },
      { id: "3", name: "Madinah" },
      { id: "4", name: "Eastern Province" },
      { id: "5", name: "Qassim" },
    ],
    cities: [
      { id: "101", provinceId: "1", name: "Riyadh" },
      { id: "201", provinceId: "2", name: "Jeddah" },
      { id: "202", provinceId: "2", name: "Mecca" },
      { id: "301", provinceId: "3", name: "Medina" },
      { id: "401", provinceId: "4", name: "Dammam" },
      { id: "402", provinceId: "4", name: "Khobar" },
    ],
    commonFirstNames: ["Mohammed", "Ahmed", "Ali", "Omar", "Khaled", "Fahad"],
    commonLastNames: ["Al-Ghamdi", "Al-Harbi", "Al-Qurashi", "Al-Sulami"],
  },
  AE: {
    country: "United Arab Emirates",
    mobilePrefix: "05",
    provinces: [
      { id: "1", name: "Abu Dhabi" },
      { id: "2", name: "Dubai" },
      { id: "3", name: "Sharjah" },
    ],
    cities: [
      { id: "101", provinceId: "1", name: "Abu Dhabi" },
      { id: "201", provinceId: "2", name: "Dubai" },
      { id: "301", provinceId: "3", name: "Sharjah" },
    ],
    commonFirstNames: ["Hamad", "Rashid", "Saeed", "Khalifa"],
    commonLastNames: ["Al-Nahyan", "Al-Maktoum", "Al-Qasimi"],
  },
  EG: {
    country: "Egypt",
    mobilePrefix: "01",
    provinces: [
      { id: "1", name: "Cairo" },
      { id: "2", name: "Alexandria" },
      { id: "3", name: "Giza" },
    ],
    cities: [
      { id: "101", provinceId: "1", name: "Cairo" },
      { id: "201", provinceId: "2", name: "Alexandria" },
      { id: "301", provinceId: "3", name: "Giza" },
    ],
    commonFirstNames: ["Mahmoud", "Ahmed", "Ali", "Hassan"],
    commonLastNames: ["Abdullah", "Hussein", "Mohamed"],
  },
};

// Generate realistic Middle Eastern names
const generateMiddleEasternName = (countryCode) => {
  const country = countryData[countryCode];
  const useCommonName = faker.datatype.boolean(0.7); // 70% chance for common local name

  return {
    firstName: useCommonName
      ? faker.helpers.arrayElement(country.commonFirstNames)
      : faker.person.firstName(),
    lastName: useCommonName
      ? faker.helpers.arrayElement(country.commonLastNames)
      : faker.person.lastName(),
  };
};

// Generate phone number based on country
const generatePhoneNumber = (countryCode) => {
  const country = countryData[countryCode];
  return `${country.mobilePrefix}${faker.number.int({
    min: 10000000,
    max: 99999999,
  })}`;
};

// Generate random coordinates within the country
const generateCoordinates = (countryCode) => {
  const countryBounds = {
    SA: { minLat: 16, maxLat: 32, minLng: 34, maxLng: 56 }, // Saudi Arabia
    AE: { minLat: 22, maxLat: 26, minLng: 51, maxLng: 56 }, // UAE
    EG: { minLat: 22, maxLat: 31.5, minLng: 25, maxLng: 35 }, // Egypt
  };

  const bounds = countryBounds[countryCode];
  return [
    bounds.minLng + Math.random() * (bounds.maxLng - bounds.minLng), // longitude
    bounds.minLat + Math.random() * (bounds.maxLat - bounds.minLat), // latitude
  ];
};

// Calculate customer tier based on spending
const determineCustomerTier = (totalSpent) => {
  if (totalSpent >= 5000) return "platinum";
  if (totalSpent >= 2000) return "gold";
  if (totalSpent >= 500) return "silver";
  return "basic";
};

// Generate customer tags based on behavior
const generateCustomerTags = (ordersCount, totalSpent) => {
  const tags = [];

  if (ordersCount === 0) tags.push("new");
  if (ordersCount > 10) tags.push("frequent");
  if (totalSpent > 3000) tags.push("vip");
  if (ordersCount > 5 && totalSpent > 1000) tags.push("loyal");

  return tags;
};

// Generate reviews for customers who have placed orders
const generateCustomerReviews = (ordersCount) => {
  if (ordersCount === 0) return [];

  const reviewCount = faker.number.int({
    min: 0,
    max: Math.min(5, ordersCount),
  });
  const reviews = [];

  for (let i = 0; i < reviewCount; i++) {
    reviews.push({
      reviewId: new mongoose.Types.ObjectId().toString(), // Ensured not null
      productId: new mongoose.Types.ObjectId(),
      title: faker.lorem.words(5),
      rating: faker.number.int({ min: 1, max: 5 }),
      reviewText: faker.lorem.paragraph(),
      photos: Array.from({ length: faker.number.int({ min: 0, max: 3 }) }, () =>
        faker.image.url()
      ),
      isVerifiedPurchase: faker.datatype.boolean(0.8),
      createdAt: faker.date.past({ years: 1 }),
    });
  }

  return reviews;
};

// Generate incentives for customers
const generateCustomerIncentives = (customerTier) => {
  const incentives = [];
  const incentiveCount =
    customerTier === "platinum"
      ? faker.number.int({ min: 1, max: 3 })
      : customerTier === "gold"
      ? faker.number.int({ min: 0, max: 2 })
      : faker.number.int({ min: 0, max: 1 });

  for (let i = 0; i < incentiveCount; i++) {
    incentives.push({
      incentiveId: new mongoose.Types.ObjectId().toString(),
      incentiveType: faker.helpers.arrayElement([
        "discount",
        "coupon",
        "cashback",
        "gift",
        "points",
      ]),
      amount: faker.number.float({ min: 5, max: 100, precision: 0.01 }),
      description: faker.lorem.sentence(),
      expiryDate: faker.date.future({ years: 1 }),
      isUsed: faker.datatype.boolean(0.3),
    });
  }

  return incentives;
};

// Generate realistic customer data
const generateCustomers = async (count = 100) => {
  const customers = [];

  for (let i = 0; i < count; i++) {
    const countryCode = faker.helpers.arrayElement(["SA", "AE", "EG"]);
    const country = countryData[countryCode];

    const { firstName, lastName } = generateMiddleEasternName(countryCode);
    const email = faker.internet
      .email({
        firstName,
        lastName,
        provider: countryCode === "SA" ? "gmail.com" : "outlook.com",
      })
      .toLowerCase();

    const mobile = generatePhoneNumber(countryCode);
    const password = await bcrypt.hash(`Customer${i + 1}@123`, 12);

    // Select random province and city
    const province = faker.helpers.arrayElement(country.provinces);
    const city = faker.helpers.arrayElement(
      country.cities.filter((c) => c.provinceId === province.id)
    );

    const ordersCount = faker.number.int({ min: 0, max: 50 });
    const totalSpent = faker.number.int({ min: 0, max: 10000 });
    const customerTier = determineCustomerTier(totalSpent);

    const customer = {
      firstName,
      lastName,
      email,
      mobile,
      password,
      role: "user",
      status: "approved",
      joinDate: faker.date.past({ years: 2 }),
      isBlocked: faker.datatype.boolean(0.05),
      verification: {
        emailVerified: faker.datatype.boolean(0.8),
        phoneVerified: faker.datatype.boolean(0.7),
        identityVerified: faker.datatype.boolean(0.3),
      },
      communicationPreferences: {
        email: true,
        sms: faker.datatype.boolean(0.6),
        whatsapp: faker.datatype.boolean(0.5),
        pushNotifications: true,
      },
      addresses: [
        {
          country: country.country,
          province: {
            id: province.id,
            name: province.name,
          },
          city: {
            id: city.id,
            provinceId: city.provinceId,
            name: city.name,
          },
          street: faker.location.streetAddress(),
          postalCode: faker.location.zipCode(),
          isDefault: true,
          location: {
            type: "Point",
            coordinates: generateCoordinates(countryCode),
          },
        },
      ],
      ordersCount,
      totalSpent,
      lastOrderDate: ordersCount > 0 ? faker.date.recent() : null,
      lastSiteVisit: faker.date.recent(),
      isSubscribedToNewsletter: faker.datatype.boolean(0.6),
      customerTier,
      tags: generateCustomerTags(ordersCount, totalSpent),
      birthDate: faker.date.birthdate({ min: 18, max: 70, mode: "age" }),
      gender: faker.helpers.arrayElement([
        "male",
        "female",
        "other",
        "prefer-not-to-say",
      ]),
      avatar: faker.image.avatar(),
      averageOrderValue:
        ordersCount > 0 ? Math.round(totalSpent / ordersCount) : 0,
      reviews: generateCustomerReviews(ordersCount),
      incentives: generateCustomerIncentives(customerTier),
    };

    // Add secondary address for some customers
    if (faker.datatype.boolean(0.3)) {
      const secondProvince = faker.helpers.arrayElement(
        country.provinces.filter((p) => p.id !== province.id)
      );
      const secondCity = faker.helpers.arrayElement(
        country.cities.filter((c) => c.provinceId === secondProvince.id)
      );

      customer.addresses.push({
        country: country.country,
        province: {
          id: secondProvince.id,
          name: secondProvince.name,
        },
        city: {
          id: secondCity.id,
          provinceId: secondCity.provinceId,
          name: secondCity.name,
        },
        street: faker.location.streetAddress(),
        postalCode: faker.location.zipCode(),
        isDefault: false,
        location: {
          type: "Point",
          coordinates: generateCoordinates(countryCode),
        },
      });
    }

    // Add activity logs for active customers
    if (ordersCount > 0) {
      customer.activityLog = Array.from(
        { length: faker.number.int({ min: 1, max: 10 }) },
        () => ({
          activityType: faker.helpers.arrayElement([
            "login",
            "purchase",
            "contact",
            "review",
          ]),
          description: faker.lorem.sentence(),
          referenceId: new ObjectId(),
          ipAddress: faker.internet.ipv4(),
          deviceInfo: `${faker.helpers.arrayElement([
            "iPhone",
            "Android",
            "Windows",
            "Mac",
          ])} ${faker.helpers.arrayElement(["10", "11", "12", "13"])}`,
          date: faker.date.recent(),
        })
      );
    }

    customers.push(customer);
  }

  return customers;
};

// Generate admin users
const generateAdminUsers = async () => {
  const admins = [];

  // Super Admin
  admins.push({
    firstName: "Admin",
    lastName: "System",
    email: "superadmin@example.com",
    password: await bcrypt.hash("SuperAdmin123!", 12),
    mobile: "0500000000",
    role: "super_admin",
    status: "approved",
    verification: {
      emailVerified: true,
      phoneVerified: true,
      identityVerified: true,
      verifiedAt: new Date(),
    },
    joinDate: new Date(2020, 0, 1),
  });

  // Regular Admins
  for (let i = 1; i <= 5; i++) {
    const { firstName, lastName } = generateMiddleEasternName("SA");
    admins.push({
      firstName,
      lastName,
      email: `admin${i}@example.com`,
      password: await bcrypt.hash(`Admin${i}123!`, 12),
      mobile: `050000000${i}`,
      role: "admin",
      status: "approved",
      verification: {
        emailVerified: true,
        phoneVerified: true,
        identityVerified: faker.datatype.boolean(0.8),
        verifiedAt: faker.date.past(),
      },
      joinDate: faker.date.past(),
    });
  }

  return admins;
};

// Main seeding function
const seedDatabase = async () => {
  try {
    await connectDB();
    console.log("Starting database seeding...");

    // Clear existing data
    await User.deleteMany({});
    console.log("Cleared existing users");

    // Generate and insert admin users
    const admins = await generateAdminUsers();
    await User.insertMany(admins);
    console.log(`Created ${admins.length} admin users`);

    // Generate and insert customer users
    const customers = await generateCustomers(100);
    await User.insertMany(customers);
    console.log(`Created ${customers.length} customer users`);

    console.log("Database seeding completed successfully");
    console.log("Sample customer:", customers[0]);
    console.log("Sample admin:", admins[0]);

    await mongoose.connection.close();
    console.log("MongoDB connection closed");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Execute the seeding process
seedDatabase();
