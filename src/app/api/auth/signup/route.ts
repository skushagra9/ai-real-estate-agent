import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, password, companyName, phone } = body;

    if (!firstName || !lastName || !email || !password || !companyName) {
      return NextResponse.json(
        { error: "All required fields must be filled" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Create partner + user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const partner = await tx.partner.create({
        data: {
          companyName,
          contactName: `${firstName} ${lastName}`,
          email: email.toLowerCase(),
          phone: phone || null,
        },
      });

      const user = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          passwordHash,
          firstName,
          lastName,
          role: "PARTNER",
          partnerId: partner.id,
        },
      });

      return { user, partner };
    });

    return NextResponse.json(
      { message: "Account created successfully", userId: result.user.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
