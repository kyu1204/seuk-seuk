"use server";

import { createServerSupabase } from "@/lib/supabase/server";

export type ContactFormData = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

export type ContactFormResult = {
  success: boolean;
  error?: string;
};

export async function sendContactEmail(
  formData: ContactFormData
): Promise<ContactFormResult> {
  try {
    // Validate input
    if (
      !formData.name ||
      !formData.email ||
      !formData.subject ||
      !formData.message
    ) {
      return {
        success: false,
        error: "All fields are required",
      };
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return {
        success: false,
        error: "Invalid email format",
      };
    }

    // Save to Supabase database
    const supabase = await createServerSupabase();
    const { error: dbError } = await supabase
      .from("contact_submissions")
      .insert({
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        message: formData.message,
      });

    if (dbError) {
      console.error("Failed to save contact submission:", dbError);
      return {
        success: false,
        error: "Failed to save contact submission. Please try again later.",
      };
    }

    // Send notification via POST request
    const notificationEndpoint = process.env.NOTIFICATION_ENDPOINT;
    if (notificationEndpoint) {
      try {
        const notificationBody = `이름: ${formData.name}\n이메일: ${formData.email}\n제목: ${formData.subject}\n메시지:\n${formData.message}`;

        await fetch(notificationEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: "슥슥 문의하기 내용이 전달되었습니다",
            body: notificationBody,
          }),
        });
      } catch (notificationError) {
        // Log notification error but don't fail the whole request
        console.error("Failed to send notification:", notificationError);
      }
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("Contact form error:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again later.",
    };
  }
}
