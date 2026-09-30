import type { MetadataRoute } from "next";
import { DEMO_JOBS } from "@/lib/data/demo";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const staticRoutes = ["", "/jobs", "/eligibility", "/exams"].map((path) => ({
    url: `${base}${path || "/"}`,
    lastModified: new Date(),
  }));
  const jobs = DEMO_JOBS.map((job) => ({
    url: `${base}/jobs/${job.slug}`,
    lastModified: new Date(),
  }));
  return [...staticRoutes, ...jobs];
}
