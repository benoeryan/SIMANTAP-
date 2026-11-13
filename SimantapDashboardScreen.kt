package com.ijefcorp.simantap.ui.dashboard

import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

// ============================================================================
// 1. BRAND COLOR PALETTE (IJEF CORP THEME)
// ============================================================================
object IjefThemeColors {
    val PrimaryRed = Color(0xFFD32F2F)         // Red Crimson
    val PrimaryRedDark = Color(0xFFB71C1C)     // Deep Crimson
    val PrimaryRedLight = Color(0xFFFFEBEE)    // Crimson Tint
    val CharcoalHeader = Color(0xFF1E1E1E)    // Surface Header
    val CharcoalDark = Color(0xFF121212)      // Deep Background
    val LightBackground = Color(0xFFF5F5F7)   // App Background
    val SurfaceWhite = Color(0xFFFFFFFF)      // Cards
    val BorderGray = Color(0xFFE0E0E0)        // Subtle Border
    val TextPrimary = Color(0xFF212121)       // Primary Text
    val TextSecondary = Color(0xFF757575)     // Subtitle Text
    val StatusPending = Color(0xFFFFA000)       // Amber
    val StatusPendingBg = Color(0xFFFFF8E1)   // Amber Light
    val StatusApproved = Color(0xFF388E3C)      // Green
    val StatusApprovedBg = Color(0xFFE8F5E9)    // Green Light
    val StatusRevision = Color(0xFFD32F2F)      // Red
    val StatusRevisionBg = Color(0xFFFFEBEE)    // Red Light
    val BadgeJapanese = Color(0xFF1565C0)      // Japanese N4 Blue
}

// ============================================================================
// 2. DATA MODELS
// ============================================================================
enum class ApprovalStatusType { PENDING, APPROVED, REVISION }

data class CandidateItem(
    val id: String,
    val name: String,
    val japaneseLevel: String,
    val isMedicalFit: Boolean,
    val discStatus: String,
    val sectorPreference: String,
    val photoUrl: String? = null
)

data class JobItem(
    val id: String,
    val title: String,
    val company: String,
    val prefecture: String,
    val salaryJpy: String,
    val sectorTag: String,
    val isHot: Boolean = false
)

data class ApprovalItem(
    val id: String,
    val candidateOrJobName: String,
    val tierStatus: String,
    val statusType: ApprovalStatusType,
    val timestamp: String
)

data class MetricSummary(
    val label: String,
    val count: String,
    val icon: ImageVector,
    val accentColor: Color
)

// ============================================================================
// 3. SAMPLE DATA PROVIDERS
// ============================================================================
object SimantapSampleData {
    val sampleCandidates = listOf(
        CandidateItem(
            id = "CND-001",
            name = "Ahmad Fariz Wicaksono",
            japaneseLevel = "N4 (JFT-Basic)",
            isMedicalFit = true,
            discStatus = "IQ 110 • Dominan D",
            sectorPreference = "KAIGO (Perawat)"
        ),
        CandidateItem(
            id = "CND-002",
            name = "Elisa Tampubolon",
            japaneseLevel = "N3 (JLPT)",
            isMedicalFit = true,
            discStatus = "IQ 115 • Dominan S",
            sectorPreference = "Pengolahan Makanan"
        ),
        CandidateItem(
            id = "CND-003",
            name = "Gani Yusuf Zaelani",
            japaneseLevel = "N4 (JFT-Basic)",
            isMedicalFit = true,
            discStatus = "IQ 108 • Dominan I",
            sectorPreference = "Konstruksi / Welder"
        ),
        CandidateItem(
            id = "CND-004",
            name = "Chica Mediana Agustin",
            japaneseLevel = "N4 (JFT-Basic)",
            isMedicalFit = true,
            discStatus = "IQ 112 • Dominan C",
            sectorPreference = "Pertanian (Agriculture)"
        )
    )

    val sampleJobs = listOf(
        JobItem(
            id = "JOB-101",
            title = "Perawat Lansia Kaigo (SSW)",
            company = "Fukushikai Medical Group",
            prefecture = "Tokyo, Japan",
            salaryJpy = "¥225,000 / Bulan",
            sectorTag = "KAIGO",
            isHot = true
        ),
        JobItem(
            id = "JOB-102",
            title = "Operator Las & Welder Konstruksi",
            company = "Kurosawa Kogyo Co., Ltd.",
            prefecture = "Osaka, Japan",
            salaryJpy = "¥240,000 / Bulan",
            sectorTag = "WELDER",
            isHot = true
        ),
        JobItem(
            id = "JOB-103",
            title = "Staf Pengolahan Makanan & Packing",
            company = "Hokkaido Food Factory",
            prefecture = "Hokkaido, Japan",
            salaryJpy = "¥210,000 / Bulan",
            sectorTag = "FOOD PROCESSING",
            isHot = false
        )
    )

    val sampleApprovals = listOf(
        ApprovalItem(
            id = "APP-01",
            candidateOrJobName = "Ahmad Fariz Wicaksono — KAIGO",
            tierStatus = "Menunggu Verifikasi Admin Doc (JIS & MCU)",
            statusType = ApprovalStatusType.PENDING,
            timestamp = "10 Menit lalu"
        ),
        ApprovalItem(
            id = "APP-02",
            candidateOrJobName = "Elisa Tampubolon — Disetujui Matching",
            tierStatus = "Disetujui Admin Doc • Ready Schedule Interview",
            statusType = ApprovalStatusType.APPROVED,
            timestamp = "1 Jam lalu"
        ),
        ApprovalItem(
            id = "APP-03",
            candidateOrJobName = "Budi Santoso — Berkas Paspor",
            tierStatus = "Perlu Revisi • Scan Paspor Kurang Jelas",
            statusType = ApprovalStatusType.REVISION,
            timestamp = "3 Jam lalu"
        )
    )

    val sampleMetrics = listOf(
        MetricSummary("Total Siswa Binaan", "175", Icons.Default.Groups, IjefThemeColors.PrimaryRed),
        MetricSummary("Interview Aktif", "13", Icons.Default.EventAvailable, Color(0xFF0288D1)),
        MetricSummary("Naitei / Disetujui", "46", Icons.Default.Verified, IjefThemeColors.StatusApproved)
    )
}

// ============================================================================
// 4. MAIN COMPOSABLE SCREEN
// ============================================================================
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SimantapDashboardScreen(
    onNavigateToCandidateDetail: (String) -> Unit = {},
    onNavigateToJobDetail: (String) -> Unit = {},
    onAddStudentClick: () -> Unit = {},
    onAddJobClick: () -> Unit = {},
    onViewJobListClick: () -> Unit = {}
) {
    var searchQuery by remember { mutableStateOf("") }
    var selectedSectorFilter by remember { mutableStateOf("Semua") }

    val sectorChips = listOf("Semua", "Kaigo", "Pertanian", "Welder", "Konstruksi", "Food Processing")

    Scaffold(
        containerColor = IjefThemeColors.LightBackground
    ) { paddingValues ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues),
            verticalArrangement = Arrangement.spacedBy(16.dp),
            contentPadding = PaddingValues(bottom = 32.dp)
        ) {
            // 1. HERO HEADER SECTION
            item {
                HeroHeaderSection(
                    searchQuery = searchQuery,
                    onSearchQueryChange = { searchQuery = it },
                    selectedSector = selectedSectorFilter,
                    sectorList = sectorChips,
                    onSectorSelected = { selectedSectorFilter = it }
                )
            }

            // 2. QUICK METRICS BAR
            item {
                QuickMetricsBarSection(metrics = SimantapSampleData.sampleMetrics)
            }

            // 3. CANDIDATE SHOWCASE ("KANDIDAT TERBAIK")
            item {
                CandidateShowcaseSection(
                    candidates = SimantapSampleData.sampleCandidates,
                    onCandidateClick = onNavigateToCandidateDetail
                )
            }

            // 4. DUAL ACTION BAR (PORTAL MITRA)
            item {
                PortalMitraActionBar(
                    onAddStudent = onAddStudentClick,
                    onAddJob = onAddJobClick,
                    onViewJobs = onViewJobListClick
                )
            }

            // 5. APPROVAL PIPELINE FEED
            item {
                ApprovalPipelineSection(
                    approvals = SimantapSampleData.sampleApprovals
                )
            }

            // 6. TRENDING JOBS GRID
            item {
                TrendingJobsSection(
                    jobs = SimantapSampleData.sampleJobs,
                    onJobClick = onNavigateToJobDetail
                )
            }
        }
    }
}

// ============================================================================
// 5. SUB-COMPOSABLES
// ============================================================================

/**
 * Hero Header with Dark Charcoal Background, IJEF CORP Title, Search Bar & Quick Filters
 */
@Composable
fun HeroHeaderSection(
    searchQuery: String,
    onSearchQueryChange: (String) -> Unit,
    selectedSector: String,
    sectorList: List<String>,
    onSectorSelected: (String) -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .background(
                color = IjefThemeColors.CharcoalHeader,
                shape = RoundedCornerShape(bottomStart = 24.dp, bottomEnd = 24.dp)
            )
            .padding(horizontal = 20.dp, vertical = 24.dp)
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
            // Brand Title & Status Badge Row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Surface(
                            shape = CircleShape,
                            color = IjefThemeColors.PrimaryRed,
                            modifier = Modifier.size(28.dp)
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Text(
                                    text = "IJEF",
                                    color = Color.White,
                                    fontSize = 9.sp,
                                    fontWeight = FontWeight.Black
                                )
                            }
                        }
                        Text(
                            text = "SIMANTAP",
                            color = Color.White,
                            fontSize = 20.sp,
                            fontWeight = FontWeight.ExtraBold,
                            letterSpacing = 1.sp
                        )
                    }
                    Text(
                        text = "LPK IJEF CORP — Sistem Manajemen Siswa & CV JIS",
                        color = Color.LightGray,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Medium
                    )
                }

                // Portal Admin Status Chip
                Surface(
                    shape = RoundedCornerShape(20.dp),
                    color = IjefThemeColors.PrimaryRed.copy(alpha = 0.2f),
                    border = androidx.compose.foundation.BorderStroke(1.dp, IjefThemeColors.PrimaryRed)
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(6.dp)
                                .clip(CircleShape)
                                .background(IjefThemeColors.StatusApproved)
                        )
                        Text(
                            text = "PORTAL MITRA",
                            color = Color.White,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }

            // Search Bar Component
            OutlinedTextField(
                value = searchQuery,
                onValueChange = onSearchQueryChange,
                placeholder = {
                    Text(
                        text = "Cari Kandidat, Prefecture (Tokyo/Osaka), atau Sektor...",
                        color = Color.Gray,
                        fontSize = 12.sp
                    )
                },
                leadingIcon = {
                    Icon(
                        imageVector = Icons.Default.Search,
                        contentDescription = "Search",
                        tint = IjefThemeColors.PrimaryRed
                    )
                },
                trailingIcon = {
                    if (searchQuery.isNotEmpty()) {
                        IconButton(onClick = { onSearchQueryChange("") }) {
                            Icon(
                                imageVector = Icons.Default.Close,
                                contentDescription = "Clear",
                                tint = Color.Gray
                            )
                        }
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp),
                shape = RoundedCornerShape(16.dp),
                colors = TextFieldDefaults.colors(
                    focusedContainerColor = IjefThemeColors.SurfaceWhite,
                    unfocusedContainerColor = IjefThemeColors.SurfaceWhite,
                    focusedIndicatorColor = IjefThemeColors.PrimaryRed,
                    unfocusedIndicatorColor = Color.Transparent,
                    focusedTextColor = IjefThemeColors.TextPrimary,
                    unfocusedTextColor = IjefThemeColors.TextPrimary
                ),
                singleLine = true
            )

            // Quick Filter Chips Row
            LazyRow(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                contentPadding = PaddingValues(vertical = 2.dp)
            ) {
                items(sectorList) { sector ->
                    val isSelected = sector == selectedSector
                    val chipBg by animateColorAsState(
                        if (isSelected) IjefThemeColors.PrimaryRed else Color(0xFF2C2C2C)
                    )
                    val chipTextColor by animateColorAsState(
                        if (isSelected) Color.White else Color.LightGray
                    )

                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = chipBg,
                        modifier = Modifier
                            .clip(RoundedCornerShape(12.dp))
                            .clickable { onSectorSelected(sector) }
                    ) {
                        Text(
                            text = sector,
                            color = chipTextColor,
                            fontSize = 11.sp,
                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                            modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp)
                        )
                    }
                }
            }
        }
    }
}

/**
 * Quick Metrics Horizontal Row
 */
@Composable
fun QuickMetricsBarSection(metrics: List<MetricSummary>) {
    Column(modifier = Modifier.padding(horizontal = 20.dp)) {
        Text(
            text = "RINGKASAN METRIK PORTAL",
            color = IjefThemeColors.TextSecondary,
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold,
            letterSpacing = 0.8.sp,
            modifier = Modifier.padding(bottom = 8.dp)
        )

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            metrics.forEach { metric ->
                Card(
                    modifier = Modifier
                        .weight(1f)
                        .height(90.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = IjefThemeColors.SurfaceWhite),
                    border = androidx.compose.foundation.BorderStroke(1.dp, IjefThemeColors.BorderGray),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(12.dp),
                        verticalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = metric.label,
                                color = IjefThemeColors.TextSecondary,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.SemiBold,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis,
                                modifier = Modifier.weight(1f)
                            )
                            Icon(
                                imageVector = metric.icon,
                                contentDescription = null,
                                tint = metric.accentColor,
                                modifier = Modifier.size(16.dp)
                            )
                        }

                        Text(
                            text = metric.count,
                            color = IjefThemeColors.TextPrimary,
                            fontSize = 22.sp,
                            fontWeight = FontWeight.Black
                        )
                    }
                }
            }
        }
    }
}

/**
 * Candidate Showcase Horizontal Carousel ("Kandidat Terbaik")
 */
@Composable
fun CandidateShowcaseSection(
    candidates: List<CandidateItem>,
    onCandidateClick: (String) -> Unit
) {
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "Kandidat Terbaik (Ready Matching)",
                    color = IjefThemeColors.TextPrimary,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "Lulus N4/JFT, Medical Fit, Rirekisho Standar JIS",
                    color = IjefThemeColors.TextSecondary,
                    fontSize = 11.sp
                )
            }
            TextButton(onClick = { }) {
                Text(
                    text = "Lihat Semua",
                    color = IjefThemeColors.PrimaryRed,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }

        LazyRow(
            contentPadding = PaddingValues(horizontal = 20.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            items(candidates) { candidate ->
                CandidateCardItem(
                    candidate = candidate,
                    onCardClick = { onCandidateClick(candidate.id) }
                )
            }
        }
    }
}

/**
 * Individual Candidate Card
 */
@Composable
fun CandidateCardItem(
    candidate: CandidateItem,
    onCardClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .width(220.dp)
            .clip(RoundedCornerShape(18.dp))
            .clickable { onCardClick() },
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = IjefThemeColors.SurfaceWhite),
        border = androidx.compose.foundation.BorderStroke(1.dp, IjefThemeColors.BorderGray),
        elevation = CardDefaults.cardElevation(defaultElevation = 3.dp)
    ) {
        Column(
            modifier = Modifier.padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            // Top Row: Avatar & Japanese Level Badge
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Surface(
                    shape = CircleShape,
                    color = IjefThemeColors.LightBackground,
                    border = androidx.compose.foundation.BorderStroke(2.dp, IjefThemeColors.PrimaryRed),
                    modifier = Modifier.size(46.dp)
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(
                            imageVector = Icons.Default.Person,
                            contentDescription = null,
                            tint = IjefThemeColors.PrimaryRed
                        )
                    }
                }

                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = IjefThemeColors.BadgeJapanese.copy(alpha = 0.1f)
                ) {
                    Text(
                        text = candidate.japaneseLevel,
                        color = IjefThemeColors.BadgeJapanese,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.ExtraBold,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                }
            }

            // Candidate Name & Sector
            Column {
                Text(
                    text = candidate.name,
                    color = IjefThemeColors.TextPrimary,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Text(
                    text = candidate.sectorPreference,
                    color = IjefThemeColors.PrimaryRed,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.SemiBold
                )
            }

            Divider(color = IjefThemeColors.BorderGray, thickness = 0.8.dp)

            // Badges: Medical Fit & DISC
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.HealthAndSafety,
                        contentDescription = null,
                        tint = IjefThemeColors.StatusApproved,
                        modifier = Modifier.size(14.dp)
                    )
                    Text(
                        text = if (candidate.isMedicalFit) "Medical Fit (Fit) ✅" else "MCU Pending",
                        color = IjefThemeColors.StatusApproved,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Medium
                    )
                }

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Psychology,
                        contentDescription = null,
                        tint = IjefThemeColors.TextSecondary,
                        modifier = Modifier.size(14.dp)
                    )
                    Text(
                        text = candidate.discStatus,
                        color = IjefThemeColors.TextSecondary,
                        fontSize = 10.sp,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }

            // CTA Button
            Button(
                onClick = onCardClick,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(36.dp),
                shape = RoundedCornerShape(10.dp),
                colors = ButtonDefaults.buttonColors(containerColor = IjefThemeColors.PrimaryRed),
                contentPadding = PaddingValues(0.dp)
            ) {
                Text(
                    text = "Ajukan Wawancara",
                    color = Color.White,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }
}

/**
 * Dual Action Bar (Portal Mitra Shortcuts)
 */
@Composable
fun PortalMitraActionBar(
    onAddStudent: () -> Unit,
    onAddJob: () -> Unit,
    onViewJobs: () -> Unit
) {
    Column(
        modifier = Modifier.padding(horizontal = 20.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        Text(
            text = "AKSI CEPAT PORTAL MITRA & LPK",
            color = IjefThemeColors.TextSecondary,
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold,
            letterSpacing = 0.8.sp
        )

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Button(
                onClick = onAddStudent,
                modifier = Modifier
                    .weight(1f)
                    .height(44.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = IjefThemeColors.CharcoalHeader)
            ) {
                Icon(
                    imageVector = Icons.Default.PersonAdd,
                    contentDescription = null,
                    modifier = Modifier.size(16.dp),
                    tint = Color.White
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                    text = "+ Siswa Baru",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
            }

            Button(
                onClick = onAddJob,
                modifier = Modifier
                    .weight(1f)
                    .height(44.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = IjefThemeColors.PrimaryRed)
            ) {
                Icon(
                    imageVector = Icons.Default.PostAdd,
                    contentDescription = null,
                    modifier = Modifier.size(16.dp),
                    tint = Color.White
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                    text = "+ Job Sendiri",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
            }

            OutlinedButton(
                onClick = onViewJobs,
                modifier = Modifier
                    .weight(1f)
                    .height(44.dp),
                shape = RoundedCornerShape(12.dp),
                border = androidx.compose.foundation.BorderStroke(1.5.dp, IjefThemeColors.CharcoalHeader),
                colors = ButtonDefaults.outlinedButtonColors(contentColor = IjefThemeColors.CharcoalHeader)
            ) {
                Icon(
                    imageVector = Icons.Default.WorkOutline,
                    contentDescription = null,
                    modifier = Modifier.size(16.dp)
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                    text = "Listing Job",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }
}

/**
 * Approval Pipeline Feed Section
 */
@Composable
fun ApprovalPipelineSection(
    approvals: List<ApprovalItem>
) {
    Column(
        modifier = Modifier.padding(horizontal = 20.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "Pipeline Approval Berkas & Job",
                    color = IjefThemeColors.TextPrimary,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "Verifikasi Multi-Tier Admin Doc & LPK IJEF",
                    color = IjefThemeColors.TextSecondary,
                    fontSize = 11.sp
                )
            }
            TextButton(onClick = { }) {
                Text(
                    text = "Riwayat",
                    color = IjefThemeColors.PrimaryRed,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }

        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            approvals.forEach { item ->
                ApprovalCardItem(approval = item)
            }
        }
    }
}

/**
 * Individual Approval Feed Card
 */
@Composable
fun ApprovalCardItem(approval: ApprovalItem) {
    val (statusBg, statusBorder, statusText) = when (approval.statusType) {
        ApprovalStatusType.PENDING -> Triple(
            IjefThemeColors.StatusPendingBg,
            IjefThemeColors.StatusPending,
            "Menunggu Approval"
        )
        ApprovalStatusType.APPROVED -> Triple(
            IjefThemeColors.StatusApprovedBg,
            IjefThemeColors.StatusApproved,
            "Disetujui"
        )
        ApprovalStatusType.REVISION -> Triple(
            IjefThemeColors.StatusRevisionBg,
            IjefThemeColors.StatusRevision,
            "Perlu Revisi"
        )
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = IjefThemeColors.SurfaceWhite),
        border = androidx.compose.foundation.BorderStroke(1.dp, IjefThemeColors.BorderGray),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Status Left Stripe / Indicator
            Box(
                modifier = Modifier
                    .width(4.dp)
                    .height(42.dp)
                    .clip(RoundedCornerShape(2.dp))
                    .background(statusBorder)
            )

            Column(modifier = Modifier.weight(1f)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = approval.candidateOrJobName,
                        color = IjefThemeColors.TextPrimary,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        modifier = Modifier.weight(1f)
                    )

                    Surface(
                        shape = RoundedCornerShape(6.dp),
                        color = statusBg
                    ) {
                        Text(
                            text = statusText,
                            color = statusBorder,
                            fontSize = 9.sp,
                            fontWeight = FontWeight.ExtraBold,
                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(2.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = approval.tierStatus,
                        color = IjefThemeColors.TextSecondary,
                        fontSize = 11.sp,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        modifier = Modifier.weight(1f)
                    )
                    Text(
                        text = approval.timestamp,
                        color = Color.Gray,
                        fontSize = 10.sp
                    )
                }
            }
        }
    }
}

/**
 * Trending Jobs Section ("Lowongan Terkini Jepang")
 */
@Composable
fun TrendingJobsSection(
    jobs: List<JobItem>,
    onJobClick: (String) -> Unit
) {
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "Lowongan Terkini (Jepang SSW / Magang)",
                    color = IjefThemeColors.TextPrimary,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "Gaji Standar UMK Jepang & Subsidi Akomodasi",
                    color = IjefThemeColors.TextSecondary,
                    fontSize = 11.sp
                )
            }
            TextButton(onClick = { }) {
                Text(
                    text = "Semua Job",
                    color = IjefThemeColors.PrimaryRed,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }

        Column(
            modifier = Modifier.padding(horizontal = 20.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            jobs.forEach { job ->
                JobCardItem(job = job, onJobClick = { onJobClick(job.id) })
            }
        }
    }
}

/**
 * Individual Job Card Item
 */
@Composable
fun JobCardItem(
    job: JobItem,
    onJobClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .clickable { onJobClick() },
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = IjefThemeColors.SurfaceWhite),
        border = androidx.compose.foundation.BorderStroke(1.dp, IjefThemeColors.BorderGray),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Surface(
                            shape = RoundedCornerShape(6.dp),
                            color = IjefThemeColors.PrimaryRedLight
                        ) {
                            Text(
                                text = job.sectorTag,
                                color = IjefThemeColors.PrimaryRed,
                                fontSize = 9.sp,
                                fontWeight = FontWeight.Black,
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                            )
                        }

                        if (job.isHot) {
                            Surface(
                                shape = RoundedCornerShape(6.dp),
                                color = IjefThemeColors.StatusPendingBg
                            ) {
                                Text(
                                    text = "🔥 HOT MATCHING",
                                    color = IjefThemeColors.StatusPending,
                                    fontSize = 9.sp,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(4.dp))

                    Text(
                        text = job.title,
                        color = IjefThemeColors.TextPrimary,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = job.company,
                        color = IjefThemeColors.TextSecondary,
                        fontSize = 12.sp
                    )
                }
            }

            Divider(color = IjefThemeColors.BorderGray, thickness = 0.8.dp)

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.LocationOn,
                        contentDescription = null,
                        tint = IjefThemeColors.PrimaryRed,
                        modifier = Modifier.size(14.dp)
                    )
                    Text(
                        text = job.prefecture,
                        color = IjefThemeColors.TextPrimary,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Medium
                    )
                }

                Text(
                    text = job.salaryJpy,
                    color = IjefThemeColors.StatusApproved,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Black
                )
            }
        }
    }
}

// ============================================================================
// 6. PREVIEW FUNCTION
// ============================================================================
@Preview(showBackground = true, widthDp = 390, heightDp = 840)
@Composable
fun SimantapDashboardScreenPreview() {
    MaterialTheme {
        SimantapDashboardScreen()
    }
}
