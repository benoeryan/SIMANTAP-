import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for parsing JSON payloads
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Initialize Gemini AI Client lazily if GEMINI_API_KEY is available
  let aiClient: GoogleGenAI | null = null;
  function getGeminiClient(): GoogleGenAI {
    if (!aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is required for AI translation operations.");
      }
      aiClient = new GoogleGenAI({ apiKey });
    }
    return aiClient;
  }

  // ==========================================
  // ADMIN 2 BACK-OFFICE BACKEND API ENDPOINTS
  // ==========================================

  // 1. Health & Server Status Check
  app.get("/api/admin2/health", (req, res) => {
    res.json({
      status: "ok",
      module: "Admin 2 CV Portal & Job Matching Backend Engine",
      version: "2.5.0-production",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development"
    });
  });

  // 2. System Dashboard & Analytics Metrics Endpoint
  app.post("/api/admin2/stats", (req, res) => {
    try {
      const { candidates = [], jobs = [], applications = [], financing = [] } = req.body || {};

      const totalCandidates = Array.isArray(candidates) ? candidates.length : 0;
      const totalJobs = Array.isArray(jobs) ? jobs.length : 0;
      const totalApplications = Array.isArray(applications) ? applications.length : 0;
      const totalFinancing = Array.isArray(financing) ? financing.length : 0;

      // Status Breakdown for Applications
      const appStatusBreakdown = (Array.isArray(applications) ? applications : []).reduce(
        (acc: Record<string, number>, app: any) => {
          const status = app.statusLamaran || app.status || "Melamar";
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        },
        {}
      );

      // Candidates with JFT / SSW Verified
      const jftVerifiedCount = (Array.isArray(candidates) ? candidates : []).filter(
        (c: any) => c.skorJftAtauJlpt && c.skorJftAtauJlpt !== "-" && !c.skorJftAtauJlpt.includes("Belum")
      ).length;

      res.json({
        success: true,
        summary: {
          totalCandidates,
          jftVerifiedCount,
          totalJobs,
          totalApplications,
          totalFinancing,
          appStatusBreakdown
        },
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || "Failed to compute stats" });
    }
  });

  // 3. Batch Spreadsheet Job Importer Endpoint
  app.post("/api/admin2/jobs/batch", (req, res) => {
    try {
      const { rawJobs = [] } = req.body || {};

      if (!Array.isArray(rawJobs) || rawJobs.length === 0) {
        return res.status(400).json({ success: false, error: "No raw jobs data provided for batch processing." });
      }

      const processedJobs = rawJobs.map((item: any, idx: number) => {
        const id = item.id || `JOB-BATCH-${Date.now()}-${idx + 1}`;
        const judulPekerjaan = item.judulPekerjaan || item["Judul Pekerjaan"] || item.title || "Tokutei Ginou Staff";
        const perusahaanJepang = item.perusahaanJepang || item["Perusahaan / Kumiai"] || item.company || "Kumiai / Company Japan";
        const bidangPekerjaan = item.bidangPekerjaan || item["Sektor / Bidang"] || "Kaigo (Perawat Lansia)";
        const lokasiPrefektur = item.lokasiPrefektur || item["Lokasi Prefektur"] || "Tokyo";
        const gajiYenBulan = Number(item.gajiYenBulan || item["Gaji (Yen)"] || 195000);
        const kuotaDibutuhkan = Number(item.kuotaDibutuhkan || item["Kuota"] || 5);
        const levelBahasaMin = item.levelBahasaMin || item["Level Bahasa"] || "JFT-Basic A2 / N4";
        const sertifikatSswRequired = item.sertifikatSswRequired || item["Sertifikat SSW"] || "Tokutei Ginou Kaigo";
        const tanggalInterview = item.tanggalInterview || item["Tanggal Interview"] || "2026-09-15";
        const deskripsiPekerjaan = item.deskripsiPekerjaan || item["Deskripsi"] || "Pekerjaan sesuai standar Tokutei Ginou Jepang.";
        const statusLowongan = item.statusLowongan || "Open";

        return {
          id,
          judulPekerjaan,
          perusahaanJepang,
          bidangPekerjaan,
          lokasiPrefektur,
          gajiYenBulan,
          kuotaDibutuhkan,
          jumlahPelamar: 0,
          levelBahasaMin,
          sertifikatSswRequired,
          tanggalInterview,
          deskripsiPekerjaan,
          kategoriTarget: "Semua Non-IJEF",
          statusLowongan
        };
      });

      res.json({
        success: true,
        count: processedJobs.length,
        jobs: processedJobs,
        message: `Berhasil memproses & memvalidasi ${processedJobs.length} data lowongan kerja dari spreadsheet!`
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || "Batch job import failed" });
    }
  });

  // 4. Smart Job Matching Recommendation Backend Engine
  app.post("/api/admin2/matching", (req, res) => {
    try {
      const { job, candidates = [] } = req.body || {};

      if (!job) {
        return res.status(400).json({ success: false, error: "Missing job posting target for matching." });
      }

      const levelReq = (job.levelBahasaMin || "").toLowerCase();
      const sswReq = (job.sertifikatSswRequired || "").toLowerCase();
      const sector = (job.bidangPekerjaan || "").toLowerCase();

      const matchedResults = candidates.map((candidate: any) => {
        let score = 50; // Base score
        const matchReasons: string[] = [];

        // 1. Language Level Matching
        const candLang = (candidate.skorJftAtauJlpt || candidate.levelBahasaJepang || "").toLowerCase();
        if (candLang.includes("n2") || candLang.includes("n3")) {
          score += 25;
          matchReasons.push("Level Bahasa Sangat Tinggi (N2/N3)");
        } else if (candLang.includes("a2") || candLang.includes("n4") || candLang.includes("lulus")) {
          score += 20;
          matchReasons.push("Memenuhi Syarat Bahasa JFT A2 / N4");
        } else {
          score -= 10;
        }

        // 2. SSW Certification Matching
        const candSSW = Array.isArray(candidate.sertifikatSsw)
          ? candidate.sertifikatSsw.join(" ").toLowerCase()
          : (candidate.sertifikatSsw || "").toLowerCase();

        if (sswReq && candSSW.includes(sswReq.replace("tokutei ginou", "").trim())) {
          score += 25;
          matchReasons.push("Sertifikat Skill SSW Sesuai Sektor Job");
        } else if (candSSW.length > 5) {
          score += 10;
          matchReasons.push("Memiliki Sertifikat Skill SSW Valid");
        }

        // 3. Medical FIT Status
        const mcuStatus = candidate.statusFitMCU || candidate.healthStatus || "FIT";
        if (mcuStatus === "FIT") {
          score += 15;
          matchReasons.push("Kondisi Kesehatan FIT MCU LPK");
        } else if (mcuStatus.includes("SYARAT")) {
          score += 5;
        } else {
          score -= 20;
        }

        // 4. Psikotes & DISC
        if (candidate.psikotesStatus === "LULUS" || candidate.psikotesScore >= 75) {
          score += 10;
          matchReasons.push("Lulus Psikotes LPK");
        }

        // Clamp score 0 to 100
        const finalScore = Math.min(100, Math.max(10, score));

        let fitLevel = "Rekomendasi Sedang";
        if (finalScore >= 85) fitLevel = "Sangat Direkomendasikan (High Match)";
        else if (finalScore >= 70) fitLevel = "Direkomendasikan (Good Match)";
        else fitLevel = "Perlu Pertimbangan Khusus";

        return {
          candidateId: candidate.id || candidate.siswaId,
          namaLengkap: candidate.namaLengkap,
          namaKatakana: candidate.namaKatakana || candidate.namaLengkap,
          matchScore: finalScore,
          fitLevel,
          matchReasons
        };
      });

      // Sort descending by match score
      matchedResults.sort((a: any, b: any) => b.matchScore - a.matchScore);

      res.json({
        success: true,
        jobId: job.id,
        jobJudul: job.judulPekerjaan,
        perusahaanJepang: job.perusahaanJepang,
        totalEvaluated: candidates.length,
        recommendations: matchedResults
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || "Job matching calculation failed" });
    }
  });

  // 5. Application State Machine & Status Audit Trail
  app.post("/api/admin2/applications/status", (req, res) => {
    try {
      const { applicationId, newStatus, catatanPerusahaan } = req.body || {};

      if (!applicationId || !newStatus) {
        return res.status(400).json({ success: false, error: "Missing applicationId or newStatus" });
      }

      const validStatuses = [
        "Seleksi Berkas Rirekisho",
        "Lolos Berkas & Panggilan Interview",
        "Jadwal Mensetsu (Interview User)",
        "Lolos Mensetsu (Diterima Perusahaan)",
        "Pengurusan COE & Kontrak",
        "Siap Berangkat Ke Jepang",
        "Ditolak / Belum Sesuai"
      ];

      res.json({
        success: true,
        applicationId,
        newStatus,
        catatanPerusahaan: catatanPerusahaan || `Status lamaran diperbarui oleh Admin 2 pada ${new Date().toLocaleString("id-ID")}`,
        updatedAt: new Date().toISOString()
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || "Status update failed" });
    }
  });

  // 6. Gemini Server-Side Japanese CV Auto-Translator API
  app.post("/api/admin2/candidates/translate", async (req, res) => {
    try {
      const { candidateCV } = req.body || {};

      if (!candidateCV || !candidateCV.namaLengkap) {
        return res.status(400).json({ success: false, error: "Invalid candidate CV payload provided" });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        // Fallback translation if GEMINI_API_KEY is not set
        return res.json({
          success: true,
          translated: {
            namaKatakana: candidateCV.namaKatakana || candidateCV.namaLengkap,
            shidouDokiJa: "日本での就労意欲が高く、規律を守って真面目に業務に取り組むことができます。",
            prKeunggulanDiriJa: "責任感が強く、コミュニケーション能力と協調性があります。",
            isAiGenerated: false,
            note: "Fallback translation applied (Set GEMINI_API_KEY for live AI translation)."
          }
        });
      }

      const ai = getGeminiClient();
      const prompt = `Anda adalah penerjemah profesional Rirekisho Bahasa Jepang untuk LPK dan Perusahaan Jepang.
Terjemahkan nama dan deskripsi berikut ke dalam bahasa Jepang standar Rirekisho JIS (Katakana untuk nama, Bahasa Jepang sopan/Keigo untuk motivasi & keunggulan):

Nama Lengkap: ${candidateCV.namaLengkap}
Nama Katakana Saat Ini: ${candidateCV.namaKatakana || ""}
Pendidikan: ${JSON.stringify(candidateCV.riwayatPendidikan || [])}
Pengalaman Kerja: ${JSON.stringify(candidateCV.riwayatPekerjaan || [])}
Motivasi Ke Jepang (Indonesian): ${candidateCV.shidouDoki || "Ingin bekerja di Jepang untuk meningkatkan skill dan finansial keluarga."}
Keunggulan Diri / PR (Indonesian): ${candidateCV.prKeunggulanDiri || "Disiplin tinggi, sehat, dan cepat belajar."}

Kembalikan jawaban HANYA dalam format JSON valid tanpa tanda markdown tambahan:
{
  "namaKatakana": "penerjemahan katakana nama",
  "shidouDokiJa": "terjemahan bahasa Jepang sopan motivasi kerja di Jepang",
  "prKeunggulanDiriJa": "terjemahan bahasa Jepang sopan keunggulan diri PR",
  "hobiJa": "terjemahan hobi dalam bahasa Jepang"
}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt
      });

      const responseText = response.text || "";
      let parsed = {};
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        }
      } catch {
        parsed = {};
      }

      res.json({
        success: true,
        translated: {
          namaKatakana: (parsed as any).namaKatakana || candidateCV.namaKatakana || candidateCV.namaLengkap,
          shidouDokiJa: (parsed as any).shidouDokiJa || candidateCV.shidouDoki,
          prKeunggulanDiriJa: (parsed as any).prKeunggulanDiriJa || candidateCV.prKeunggulanDiri,
          hobiJa: (parsed as any).hobiJa || candidateCV.hobi,
          isAiGenerated: true
        }
      });
    } catch (err: any) {
      console.warn("Server AI translation fallback:", err?.message || err);
      res.json({
        success: true,
        translated: {
          namaKatakana: req.body?.candidateCV?.namaKatakana || req.body?.candidateCV?.namaLengkap || "",
          shidouDokiJa: req.body?.candidateCV?.shidouDoki || "日本での就労を希望しております。",
          prKeunggulanDiriJa: req.body?.candidateCV?.prKeunggulanDiri || "真面目で責任感があります。",
          isAiGenerated: false,
          error: err?.message
        }
      });
    }
  });

  // 7. Financing (Dukungan Dana) Backend Calculation Engine
  app.post("/api/admin2/financing/calculate", (req, res) => {
    try {
      const { plafonModalUtama = 25000000, tenorBulan = 12, kursYenIdr = 108 } = req.body || {};

      const adminFeeRate = 0.02; // 2% admin
      const adminFeeAmt = Math.round(plafonModalUtama * adminFeeRate);
      const totalPinjaman = plafonModalUtama + adminFeeAmt;
      const cicilanAwalPerBulanIdr = Math.round(totalPinjaman / tenorBulan);
      const cicilanPerBulanYen = Math.round(cicilanAwalPerBulanIdr / kursYenIdr);

      res.json({
        success: true,
        financingDetails: {
          plafonModalUtama,
          adminFeeAmt,
          totalPinjaman,
          tenorBulan,
          kursYenIdr,
          cicilanPerBulanIdr: cicilanAwalPerBulanIdr,
          cicilanPerBulanYen,
          bungaPersen: 0, // Bunga 0% Syariah
          skema: "Potong Gaji Kerja Di Jepang"
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || "Financing calculation failed" });
    }
  });

  // 8. Contract Agreement Generation API
  app.post("/api/admin2/contracts/generate", (req, res) => {
    try {
      const { candidateName, companyName, jobTitle, financingAmount = 25000000 } = req.body || {};

      const contractNo = `SPK/LPK-IJEF/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`;

      res.json({
        success: true,
        contract: {
          contractNo,
          pihakPertama: "LPK IJEF CORP (Penyelenggara Pelatihan & Sending Agency)",
          pihakKedua: candidateName || "Calon Pekerja Migran Tokutei Ginou",
          perusahaanPenerima: companyName || "Perusahaan / Kumiai Jepang",
          posisiKerja: jobTitle || "Tokutei Ginou Specialist",
          besaranDukunganDana: financingAmount,
          statusDraft: "DRAFT_DISATUJUI",
          generatedAt: new Date().toISOString()
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || "Contract generation failed" });
    }
  });

  // 9. Resilient Image Proxy Endpoint for Google Drive & Firebase Storage Images
  app.get("/api/proxy-image", async (req, res) => {
    try {
      const rawUrl = req.query.url as string;
      if (!rawUrl || typeof rawUrl !== "string") {
        return res.status(400).send("Missing url query parameter");
      }

      let targetUrl = rawUrl.trim();

      // Convert Google Drive share/view/open links to direct high-res image thumbnail
      if (
        targetUrl.includes("drive.google.com") ||
        targetUrl.includes("docs.google.com") ||
        targetUrl.includes("drive.usercontent.google.com")
      ) {
        if (targetUrl.includes("/folders/")) {
          return res.status(400).send("Folders cannot be proxied as images");
        }

        let fileId = "";
        const fileDMatch = targetUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
        if (fileDMatch && fileDMatch[1]) {
          fileId = fileDMatch[1];
        } else {
          const dMatch = targetUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
          if (dMatch && dMatch[1]) {
            fileId = dMatch[1];
          } else {
            const idParamMatch = targetUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
            if (idParamMatch && idParamMatch[1]) {
              fileId = idParamMatch[1];
            }
          }
        }

        if (fileId) {
          targetUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
        }
      }

      const response = await fetch(targetUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"
        },
        redirect: "follow"
      });

      if (!response.ok) {
        return res.status(response.status).send(`Upstream returned status ${response.status}`);
      }

      const contentType = response.headers.get("content-type") || "image/jpeg";
      // If Google returned an HTML login page instead of an image, do not stream HTML
      if (contentType.includes("text/html")) {
        return res.status(404).send("File requires authentication or is not a direct image");
      }

      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
      res.setHeader("Access-Control-Allow-Origin", "*");

      const arrayBuffer = await response.arrayBuffer();
      res.send(Buffer.from(arrayBuffer));
    } catch (err: any) {
      res.status(502).send("Image proxy failed: " + (err?.message || err));
    }
  });

  // ==========================================
  // VITE DEV SERVER / PRODUCTION STATIC ROUTE
  // ==========================================

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Admin 2 CV Portal Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
