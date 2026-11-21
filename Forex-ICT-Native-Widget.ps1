# Forex & ICT Native StandBy Desktop Widget
# Features: Flush Corner Snapping (Zero gap), Crash-Proof Dragging,
# True Pearl Light Mode ⇄ Obsidian Night Mode,
# Expand/Collapse All 7 ICT Sessions Panel, Luxury Professional Typography
Add-Type -AssemblyName PresentationFramework, PresentationCore, WindowsBase, System.Drawing, System.Windows.Forms

# Single-instance cleanup
$pidFile = "$env:TEMP\forex_ict_widget_native.pid"
if (Test-Path $pidFile) {
    $oldPid = Get-Content $pidFile -ErrorAction SilentlyContinue
    if ($oldPid) {
        Stop-Process -Id $oldPid -Force -ErrorAction SilentlyContinue
    }
    Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
}
Set-Content -Path $pidFile -Value $PID -ErrorAction SilentlyContinue

# Precompute 60 ticks around 126x126 squircle (radius 16, tick length 5)
function Get-Ticks {
    $W = 126.0; $H = 126.0; $R = 16.0; $tickLen = 5.0
    $topEdge = $W - 2.0 * $R
    $rightEdge = $H - 2.0 * $R
    $bottomEdge = $W - 2.0 * $R
    $leftEdge = $H - 2.0 * $R
    $cornerLen = ([Math]::PI / 2.0) * $R
    $totalPerim = $topEdge + $rightEdge + $bottomEdge + $leftEdge + 4.0 * $cornerLen

    $ticks = @()
    for ($i = 0; $i -lt 60; $i++) {
        $dist = ($i / 60.0) * $totalPerim
        $d = (($dist % $totalPerim) + $totalPerim) % $totalPerim

        $ptX = 0; $ptY = 0; $nx = 0; $ny = 0
        if ($d -lt ($topEdge / 2.0)) {
            $ptX = $W / 2.0 + $d; $ptY = 0; $nx = 0; $ny = 1
        } else {
            $d -= ($topEdge / 2.0)
            if ($d -lt $cornerLen) {
                $angle = -([Math]::PI / 2.0) + ($d / $cornerLen) * ([Math]::PI / 2.0)
                $ptX = ($W - $R) + $R * [Math]::Cos($angle)
                $ptY = $R + $R * [Math]::Sin($angle)
                $nx = -[Math]::Cos($angle); $ny = -[Math]::Sin($angle)
            } else {
                $d -= $cornerLen
                if ($d -lt $rightEdge) {
                    $ptX = $W; $ptY = $R + $d; $nx = -1; $ny = 0
                } else {
                    $d -= $rightEdge
                    if ($d -lt $cornerLen) {
                        $angle = ($d / $cornerLen) * ([Math]::PI / 2.0)
                        $ptX = ($W - $R) + $R * [Math]::Cos($angle)
                        $ptY = ($H - $R) + $R * [Math]::Sin($angle)
                        $nx = -[Math]::Cos($angle); $ny = -[Math]::Sin($angle)
                    } else {
                        $d -= $cornerLen
                        if ($d -lt $bottomEdge) {
                            $ptX = ($W - $R) - $d; $ptY = $H; $nx = 0; $ny = -1
                        } else {
                            $d -= $bottomEdge
                            if ($d -lt $cornerLen) {
                                $angle = ([Math]::PI / 2.0) + ($d / $cornerLen) * ([Math]::PI / 2.0)
                                $ptX = $R + $R * [Math]::Cos($angle)
                                $ptY = ($H - $R) + $R * [Math]::Sin($angle)
                                $nx = -[Math]::Cos($angle); $ny = -[Math]::Sin($angle)
                            } else {
                                $d -= $cornerLen
                                if ($d -lt $leftEdge) {
                                    $ptX = 0; $ptY = ($H - $R) - $d; $nx = 1; $ny = 0
                                } else {
                                    $d -= $leftEdge
                                    if ($d -lt $cornerLen) {
                                        $angle = [Math]::PI + ($d / $cornerLen) * ([Math]::PI / 2.0)
                                        $ptX = $R + $R * [Math]::Cos($angle)
                                        $ptY = $R + $R * [Math]::Sin($angle)
                                        $nx = -[Math]::Cos($angle); $ny = -[Math]::Sin($angle)
                                    } else {
                                        $d -= $cornerLen
                                        $ptX = $R + $d; $ptY = 0; $nx = 0; $ny = 1
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        $ticks += [PSCustomObject]@{
            Index = $i
            X1 = [Math]::Round($ptX, 1)
            Y1 = [Math]::Round($ptY, 1)
            X2 = [Math]::Round(($ptX + $nx * $tickLen), 1)
            Y2 = [Math]::Round(($ptY + $ny * $tickLen), 1)
        }
    }
    return $ticks
}

$script:TicksData = Get-Ticks
$script:UseNy = $false
$script:IsDayTheme = $false
$script:IsExpanded = $false

# Screen bounds in WPF native DIP units
$area = [System.Windows.SystemParameters]::WorkArea
$winW = 405
$winH = 202
$expandedH = 314
$initX = $area.Right - $winW - 2
$initY = $area.Bottom - $winH - 2

# Pure XAML with Flush Borders, Luxury Typography, and Expandable Session Panel
$xaml = @"
<Window xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        Title="Forex ICT Crystal StandBy"
        Width="$winW" Height="$winH"
        Left="$initX" Top="$initY"
        WindowStyle="None"
        AllowsTransparency="True"
        Background="Transparent"
        Topmost="True"
        ShowInTaskbar="True"
        ResizeMode="NoResize"
        WindowStartupLocation="Manual">
    <Grid Margin="0">
        <!-- Main Card Border (CornerRadius 16, Apple Specular Obsidian Crystal Glass) -->
        <Border Name="MainCard" CornerRadius="16" BorderBrush="#35FFFFFF" BorderThickness="1.2">
            <Border.Background>
                <LinearGradientBrush StartPoint="0,0" EndPoint="0,1">
                    <GradientStop Color="#F8121726" Offset="0.0"/>
                    <GradientStop Color="#F40E1320" Offset="0.3"/>
                    <GradientStop Color="#F0090D16" Offset="1.0"/>
                </LinearGradientBrush>
            </Border.Background>
            <Grid Margin="10,7,10,8">
                <Grid.RowDefinitions>
                    <RowDefinition Height="26"/>
                    <RowDefinition Height="*"/>
                    <RowDefinition Height="Auto"/>
                </Grid.RowDefinitions>

                <!-- 1. Header Bar -->
                <Grid Grid.Row="0" Name="HeaderBar" Background="Transparent" Cursor="SizeAll">
                    <Grid.ColumnDefinitions>
                        <ColumnDefinition Width="Auto"/>
                        <ColumnDefinition Width="*"/>
                        <ColumnDefinition Width="Auto"/>
                    </Grid.ColumnDefinitions>

                    <!-- Status Dot & Title -->
                    <StackPanel Grid.Column="0" Orientation="Horizontal" VerticalAlignment="Center">
                        <Ellipse Name="LivePulseDot" Width="7" Height="7" Fill="#10B981" Margin="2,0,5,0"/>
                        <TextBlock Name="TxtHeaderTitle" Text="FOREX &amp; ICT STANDBY" Foreground="#E0E7FF" FontSize="10" FontWeight="Bold" FontFamily="Segoe UI" VerticalAlignment="Center"/>
                    </StackPanel>

                    <!-- Right Controls (Expand, Theme, TZ, Minimize, Close) -->
                    <StackPanel Grid.Column="2" Orientation="Horizontal" VerticalAlignment="Center">
                        <!-- Expand / Collapse All Sessions Button -->
                        <Border Name="BtnExpand" CornerRadius="5" Background="#1E2536" BorderBrush="#2E3850" BorderThickness="1" Padding="5,1.5" Margin="0,0,3,0" Cursor="Hand" ToolTip="View All 7 ICT Sessions">
                            <TextBlock Name="TxtExpandIcon" Text="&#x25BE; ALL" Foreground="#F8FAFC" FontSize="8" FontWeight="Bold" FontFamily="Segoe UI"/>
                        </Border>

                        <!-- Theme Toggle Button (Moon / Sun) -->
                        <Border Name="BtnTheme" CornerRadius="5" Background="#1E2536" BorderBrush="#2E3850" BorderThickness="1" Width="20" Height="19" Margin="0,0,3,0" Cursor="Hand" ToolTip="Toggle Day Light / Night Dark Theme">
                            <TextBlock Name="TxtThemeIcon" Text="&#x263D;" Foreground="#F8FAFC" FontSize="9" HorizontalAlignment="Center" VerticalAlignment="Center"/>
                        </Border>

                        <!-- Session Alarm Toggle Button (Bell Icon) -->
                        <Border Name="BtnAlarm" CornerRadius="5" Background="#1E2536" BorderBrush="#2E3850" BorderThickness="1" Width="20" Height="19" Margin="0,0,3,0" Cursor="Hand" ToolTip="Session Alarm: ON (Click to Mute)">
                            <TextBlock Name="TxtAlarmIcon" Text="&#x1F514;" Foreground="#34D399" FontSize="9" HorizontalAlignment="Center" VerticalAlignment="Center"/>
                        </Border>

                        <!-- NY / LOC Toggle Button -->
                        <Border Name="BtnTz" CornerRadius="5" Background="#1E2536" BorderBrush="#2E3850" BorderThickness="1" Padding="5,1.5" Margin="0,0,3,0" Cursor="Hand" ToolTip="Toggle Timezone">
                            <TextBlock Name="TxtTz" Text="LOC &#x21C4; NY" Foreground="#F8FAFC" FontSize="8" FontWeight="Bold" FontFamily="Segoe UI"/>
                        </Border>

                        <!-- Minimize Button (-) -->
                        <Border Name="BtnMinimize" CornerRadius="5" Background="#1E2536" BorderBrush="#2E3850" BorderThickness="1" Width="19" Height="19" Margin="0,0,3,0" Cursor="Hand">
                            <TextBlock Name="TxtMinIcon" Text="&#x2212;" Foreground="#F8FAFC" FontSize="9.5" FontWeight="Bold" HorizontalAlignment="Center" VerticalAlignment="Center" Margin="0,-2,0,0"/>
                        </Border>

                        <!-- Close Button (X) -->
                        <Border Name="BtnClose" CornerRadius="5" Background="#1E2536" BorderBrush="#2E3850" BorderThickness="1" Width="19" Height="19" Cursor="Hand">
                            <TextBlock Name="TxtCloseIcon" Text="&#x2715;" Foreground="#F8FAFC" FontSize="8.5" FontWeight="Bold" HorizontalAlignment="Center" VerticalAlignment="Center"/>
                        </Border>
                    </StackPanel>
                </Grid>

                <!-- 2. Main Balanced View: Clock (Left 140px) + Cards (Right 138px) -->
                <Grid Grid.Row="1" Margin="0,5,0,0" VerticalAlignment="Center">
                    <Grid.ColumnDefinitions>
                        <ColumnDefinition Width="140"/>
                        <ColumnDefinition Width="*"/>
                    </Grid.ColumnDefinitions>

                    <!-- LEFT: StandBy Clock with 60 perimeter ticks -->
                    <Border Name="ClockBorder" Grid.Column="0" CornerRadius="11" Background="#F4131A29" BorderBrush="#25FFFFFF" BorderThickness="1.2" Width="140" Height="140" HorizontalAlignment="Left" VerticalAlignment="Center">
                        <Grid>
                            <Canvas Name="TicksCanvas" Width="126" Height="126" HorizontalAlignment="Center" VerticalAlignment="Center"/>
                            <StackPanel VerticalAlignment="Center" HorizontalAlignment="Center">
                                <StackPanel Orientation="Horizontal" HorizontalAlignment="Center" Margin="0,0,0,2">
                                    <Border Name="BadgeAmpm" CornerRadius="4" Background="#202738" BorderBrush="#2C374E" BorderThickness="1" Padding="4,1" Margin="0,0,3,0">
                                        <TextBlock Name="TxtAmpm" Text="AM" Foreground="#E2E8F0" FontSize="8.5" FontWeight="Bold" FontFamily="Segoe UI"/>
                                    </Border>
                                    <Border Name="BadgeZone" CornerRadius="4" Background="#1C2340" BorderBrush="#354270" BorderThickness="1" Padding="4,1">
                                        <TextBlock Name="TxtZone" Text="LOCAL" Foreground="#A5B4FC" FontSize="8" FontWeight="Bold" FontFamily="Segoe UI"/>
                                    </Border>
                                </StackPanel>
                                <TextBlock Name="TxtTime" Text="06:07" Foreground="#FFFFFF" FontSize="31" FontWeight="Bold" FontStretch="Expanded" FontFamily="Bahnschrift, Cascadia Mono, Consolas" HorizontalAlignment="Center"/>
                                <Border Name="BadgeSec" CornerRadius="5" Background="#101420" BorderBrush="#242D40" BorderThickness="1" Padding="6,1.5" HorizontalAlignment="Center" Margin="0,2,0,0">
                                    <StackPanel Orientation="Horizontal">
                                        <TextBlock Name="TxtSec" Text="27" Foreground="#34D399" FontSize="10.5" FontWeight="Bold" FontFamily="Bahnschrift, Consolas"/>
                                        <TextBlock Name="TxtSecLabel" Text=" SEC" Foreground="#94A3B8" FontSize="8" FontWeight="Bold" VerticalAlignment="Center"/>
                                    </StackPanel>
                                </Border>
                            </StackPanel>
                        </Grid>
                    </Border>

                    <!-- RIGHT: Balanced Cards, perfectly matching Clock Height (66 + 6 + 66 = 138px) -->
                    <Grid Grid.Column="1" Margin="8,0,0,0" VerticalAlignment="Center">
                        <Grid.RowDefinitions>
                            <RowDefinition Height="66"/>
                            <RowDefinition Height="66"/>
                        </Grid.RowDefinitions>

                        <!-- Active Session Card -->
                        <Border Grid.Row="0" Name="CardActive" CornerRadius="9" Background="#F4131A29" BorderBrush="#25FFFFFF" BorderThickness="1" Padding="8,4" Margin="0,0,0,6">
                            <Grid>
                                <Grid.RowDefinitions>
                                    <RowDefinition Height="Auto"/>
                                    <RowDefinition Height="Auto"/>
                                    <RowDefinition Height="*"/>
                                </Grid.RowDefinitions>
                                <Grid Grid.Row="0">
                                    <TextBlock Name="TxtActiveLabel" Text="CURRENT SESSION" Foreground="#A5B4FC" FontSize="8.5" FontWeight="SemiBold" FontFamily="Segoe UI"/>
                                    <Border Name="BadgeActive" CornerRadius="3.5" Background="#1A2D24" BorderBrush="#2D6A4F" BorderThickness="1" Padding="5,1" HorizontalAlignment="Right">
                                        <TextBlock Name="TxtActiveBadge" Text="ACTIVE" Foreground="#34D399" FontSize="7.5" FontWeight="Bold"/>
                                    </Border>
                                </Grid>
                                <Grid Grid.Row="1" Margin="0,1,0,0">
                                    <TextBlock Name="TxtActiveName" Text="New York AM" Foreground="#FFFFFF" FontSize="12.5" FontWeight="Bold" FontFamily="Segoe UI"/>
                                    <TextBlock Name="TxtActiveHours" Text="16:30 - 21:30" Foreground="#E2E8F0" FontSize="10" FontWeight="SemiBold" FontFamily="Consolas" HorizontalAlignment="Right" VerticalAlignment="Center"/>
                                </Grid>
                                <DockPanel Grid.Row="2" VerticalAlignment="Bottom">
                                    <TextBlock Name="TxtActiveEndsInLabel" Text="Ends in:" Foreground="#94A3B8" FontSize="9" FontWeight="SemiBold" VerticalAlignment="Center"/>
                                    <Border Name="BadgeActiveCd" CornerRadius="4" Background="#101420" BorderBrush="#242D40" BorderThickness="1" Padding="6,1" HorizontalAlignment="Right">
                                        <TextBlock Name="TxtActiveCountdown" Text="03:22:30" Foreground="#34D399" FontSize="11.5" FontWeight="Bold" FontFamily="Consolas"/>
                                    </Border>
                                </DockPanel>
                            </Grid>
                        </Border>

                        <!-- Next Upcoming Session Card -->
                        <Border Grid.Row="1" Name="CardNext" CornerRadius="9" Background="#F4131A29" BorderBrush="#25FFFFFF" BorderThickness="1" Padding="8,4">
                            <Grid>
                                <Grid.RowDefinitions>
                                    <RowDefinition Height="Auto"/>
                                    <RowDefinition Height="Auto"/>
                                    <RowDefinition Height="*"/>
                                </Grid.RowDefinitions>
                                <Grid Grid.Row="0">
                                    <TextBlock Name="TxtNextLabel" Text="NEXT UPCOMING" Foreground="#A5B4FC" FontSize="8.5" FontWeight="SemiBold" FontFamily="Segoe UI"/>
                                    <Border Name="BadgeNext" CornerRadius="3.5" Background="#1C2340" BorderBrush="#354270" BorderThickness="1" Padding="5,1" HorizontalAlignment="Right">
                                        <TextBlock Name="BadgeNextText" Text="UPCOMING" Foreground="#A5B4FC" FontSize="7.5" FontWeight="Bold"/>
                                    </Border>
                                </Grid>
                                <Grid Grid.Row="1" Margin="0,1,0,0">
                                    <TextBlock Name="TxtNextName" Text="NY PM Silver Bullet (SB)" Foreground="#FFFFFF" FontSize="12.5" FontWeight="Bold" FontFamily="Segoe UI"/>
                                    <TextBlock Name="TxtNextHours" Text="19:30 - 20:30" Foreground="#E2E8F0" FontSize="10" FontWeight="SemiBold" FontFamily="Consolas" HorizontalAlignment="Right" VerticalAlignment="Center"/>
                                </Grid>
                                <DockPanel Grid.Row="2" VerticalAlignment="Bottom">
                                    <TextBlock Name="TxtNextStartsInLabel" Text="Starts in:" Foreground="#94A3B8" FontSize="9" FontWeight="SemiBold" VerticalAlignment="Center"/>
                                    <Border Name="BadgeNextCd" CornerRadius="4" Background="#101420" BorderBrush="#222B40" BorderThickness="1" Padding="6,1" HorizontalAlignment="Right">
                                        <TextBlock Name="TxtNextCountdown" Text="00:19:30" Foreground="#A5B4FC" FontSize="11.5" FontWeight="Bold" FontFamily="Consolas"/>
                                    </Border>
                                </DockPanel>
                            </Grid>
                        </Border>
                    </Grid>
                </Grid>

                <!-- 3. Expandable Sessions Panel (High-Density 2-Column Institutional Layout) -->
                <Border Grid.Row="2" Name="ExpandPanel" Visibility="Collapsed" Opacity="0" CornerRadius="9" Background="#F40E1320" BorderBrush="#25FFFFFF" BorderThickness="1" Padding="8,5" Margin="0,5,0,0">
                    <Grid>
                        <Grid.RowDefinitions>
                            <RowDefinition Height="Auto"/>
                            <RowDefinition Height="*"/>
                        </Grid.RowDefinitions>

                        <!-- Header Row with Live Market Indicator -->
                        <Grid Grid.Row="0" Margin="0,0,0,3.5">
                            <TextBlock Name="TxtExpandPanelHeader" Text="ALL 7 FOREX &amp; ICT MARKET SESSIONS" Foreground="#A5B4FC" FontSize="8.5" FontWeight="Bold" FontFamily="Segoe UI"/>
                            <TextBlock Name="TxtExpandTzNote" Text="LOCAL TIME" Foreground="#94A3B8" FontSize="8" FontWeight="SemiBold" FontFamily="Consolas" HorizontalAlignment="Right"/>
                        </Grid>

                        <!-- 2-Column Institutional Session Matrix -->
                        <Grid Grid.Row="1">
                            <Grid.ColumnDefinitions>
                                <ColumnDefinition Width="*"/>
                                <ColumnDefinition Width="6"/>
                                <ColumnDefinition Width="*"/>
                            </Grid.ColumnDefinitions>

                            <!-- Column 1: Core Killzones -->
                            <Border Grid.Column="0" Name="BorderCoreCol" CornerRadius="6" Background="#121826" BorderBrush="#20FFFFFF" BorderThickness="1" Padding="6,3.5">
                                <StackPanel>
                                    <TextBlock Text="CORE KILLZONES" Foreground="#818CF8" FontSize="7.5" FontWeight="Bold" Margin="0,0,0,2"/>
                                    <!-- 1. Asia -->
                                    <Grid Name="RowS1" Margin="0,1">
                                        <StackPanel Orientation="Horizontal" VerticalAlignment="Center">
                                            <Ellipse Name="DotS1" Width="5" Height="5" Fill="#64748B" Margin="0,0,3.5,0"/>
                                            <TextBlock Name="TxtS1Name" Text="1. Asia (Tokyo)" Foreground="#CBD5E1" FontSize="8.5"/>
                                        </StackPanel>
                                        <TextBlock Name="TxtS1Time" Text="20:00 - 00:00" Foreground="#94A3B8" FontSize="8" FontWeight="SemiBold" FontFamily="Consolas" HorizontalAlignment="Right" VerticalAlignment="Center"/>
                                    </Grid>
                                    <!-- 2. London -->
                                    <Grid Name="RowS2" Margin="0,1">
                                        <StackPanel Orientation="Horizontal" VerticalAlignment="Center">
                                            <Ellipse Name="DotS2" Width="5" Height="5" Fill="#64748B" Margin="0,0,3.5,0"/>
                                            <TextBlock Name="TxtS2Name" Text="2. London Open" Foreground="#CBD5E1" FontSize="8.5"/>
                                        </StackPanel>
                                        <TextBlock Name="TxtS2Time" Text="02:00 - 05:00" Foreground="#94A3B8" FontSize="8" FontWeight="SemiBold" FontFamily="Consolas" HorizontalAlignment="Right" VerticalAlignment="Center"/>
                                    </Grid>
                                    <!-- 3. NY AM -->
                                    <Grid Name="RowS4" Margin="0,1">
                                        <StackPanel Orientation="Horizontal" VerticalAlignment="Center">
                                            <Ellipse Name="DotS4" Width="5" Height="5" Fill="#64748B" Margin="0,0,3.5,0"/>
                                            <TextBlock Name="TxtS4Name" Text="3. New York AM" Foreground="#CBD5E1" FontSize="8.5"/>
                                        </StackPanel>
                                        <TextBlock Name="TxtS4Time" Text="07:00 - 12:00" Foreground="#94A3B8" FontSize="8" FontWeight="SemiBold" FontFamily="Consolas" HorizontalAlignment="Right" VerticalAlignment="Center"/>
                                    </Grid>
                                    <!-- 4. NY PM -->
                                    <Grid Name="RowS6" Margin="0,1">
                                        <StackPanel Orientation="Horizontal" VerticalAlignment="Center">
                                            <Ellipse Name="DotS6" Width="5" Height="5" Fill="#64748B" Margin="0,0,3.5,0"/>
                                            <TextBlock Name="TxtS6Name" Text="4. New York PM" Foreground="#CBD5E1" FontSize="8.5"/>
                                        </StackPanel>
                                        <TextBlock Name="TxtS6Time" Text="13:00 - 16:00" Foreground="#94A3B8" FontSize="8" FontWeight="SemiBold" FontFamily="Consolas" HorizontalAlignment="Right" VerticalAlignment="Center"/>
                                    </Grid>
                                </StackPanel>
                            </Border>

                            <!-- Column 2: Silver Bullets -->
                            <Border Grid.Column="2" Name="BorderSbCol" CornerRadius="6" Background="#161722" BorderBrush="#25FBBF24" BorderThickness="1" Padding="6,3.5">
                                <StackPanel>
                                    <TextBlock Text="ICT SILVER BULLETS (1H)" Foreground="#FBBF24" FontSize="7.5" FontWeight="Bold" Margin="0,0,0,2"/>
                                    <!-- London SB -->
                                    <Grid Name="RowS3" Margin="0,1">
                                        <StackPanel Orientation="Horizontal" VerticalAlignment="Center">
                                            <Ellipse Name="DotS3" Width="5" Height="5" Fill="#64748B" Margin="0,0,3.5,0"/>
                                            <TextBlock Name="TxtS3Name" Text="London SB" Foreground="#FBBF24" FontSize="8.5" FontWeight="SemiBold"/>
                                        </StackPanel>
                                        <TextBlock Name="TxtS3Time" Text="03:00 - 04:00" Foreground="#FDE68A" FontSize="8" FontWeight="SemiBold" FontFamily="Consolas" HorizontalAlignment="Right" VerticalAlignment="Center"/>
                                    </Grid>
                                    <!-- NY AM SB -->
                                    <Grid Name="RowS5" Margin="0,1">
                                        <StackPanel Orientation="Horizontal" VerticalAlignment="Center">
                                            <Ellipse Name="DotS5" Width="5" Height="5" Fill="#64748B" Margin="0,0,3.5,0"/>
                                            <TextBlock Name="TxtS5Name" Text="NY AM SB" Foreground="#FBBF24" FontSize="8.5" FontWeight="SemiBold"/>
                                        </StackPanel>
                                        <TextBlock Name="TxtS5Time" Text="10:00 - 11:00" Foreground="#FDE68A" FontSize="8" FontWeight="SemiBold" FontFamily="Consolas" HorizontalAlignment="Right" VerticalAlignment="Center"/>
                                    </Grid>
                                    <!-- NY PM SB -->
                                    <Grid Name="RowS7" Margin="0,1">
                                        <StackPanel Orientation="Horizontal" VerticalAlignment="Center">
                                            <Ellipse Name="DotS7" Width="5" Height="5" Fill="#64748B" Margin="0,0,3.5,0"/>
                                            <TextBlock Name="TxtS7Name" Text="NY PM SB" Foreground="#FBBF24" FontSize="8.5" FontWeight="SemiBold"/>
                                        </StackPanel>
                                        <TextBlock Name="TxtS7Time" Text="14:00 - 15:00" Foreground="#FDE68A" FontSize="8" FontWeight="SemiBold" FontFamily="Consolas" HorizontalAlignment="Right" VerticalAlignment="Center"/>
                                    </Grid>
                                    <!-- Live Status Pill -->
                                    <Border Name="BadgeSbInfo" CornerRadius="3" Background="#1AFBBF24" BorderBrush="#35FBBF24" BorderThickness="1" Padding="3,1" Margin="0,1.5,0,0">
                                        <TextBlock Name="TxtSbLiveInfo" Text="1H Institutional Window" Foreground="#FDE68A" FontSize="7.5" FontWeight="SemiBold" HorizontalAlignment="Center"/>
                                    </Border>
                                </StackPanel>
                            </Border>
                        </Grid>
                    </Grid>
                </Border>
            </Grid>
        </Border>
    </Grid>
</Window>
"@

$reader = [System.Xml.XmlReader]::Create([System.IO.StringReader]::new($xaml))
$window = [System.Windows.Markup.XamlReader]::Load($reader)


# Get Named Controls
$mainCard = $window.FindName("MainCard")
$script:NightCardBg = $mainCard.Background
$script:NightCardBorder = $mainCard.BorderBrush
$bcInit = [System.Windows.Media.BrushConverter]::new()
$script:DayCardBg = $bcInit.ConvertFromString("#FAFBFD")
$script:DayCardBorder = $bcInit.ConvertFromString("#50CBD5E1")

$headerBar = $window.FindName("HeaderBar")
$btnExpand = $window.FindName("BtnExpand")
$txtExpandIcon = $window.FindName("TxtExpandIcon")
$btnTheme = $window.FindName("BtnTheme")
$txtThemeIcon = $window.FindName("TxtThemeIcon")
$btnAlarm = $window.FindName("BtnAlarm")
$txtAlarmIcon = $window.FindName("TxtAlarmIcon")
$btnTz = $window.FindName("BtnTz")
$txtTz = $window.FindName("TxtTz")
$btnMin = $window.FindName("BtnMinimize")
$btnClose = $window.FindName("BtnClose")

$script:AlarmEnabled = $true
$script:LastSessionState = $null
$script:ToastTicks = 0
$script:ToastMsg = ""

# Pre-load high quality Windows notification chimes
$script:SoundPlayerStart = $null
$script:SoundPlayerEnd = $null
try {
    $sndStartPath = "C:\Windows\Media\Windows Notify Calendar.wav"
    if (-not (Test-Path $sndStartPath)) { $sndStartPath = "C:\Windows\Media\notify.wav" }
    if (Test-Path $sndStartPath) {
        $script:SoundPlayerStart = New-Object System.Media.SoundPlayer $sndStartPath
        $script:SoundPlayerStart.LoadAsync()
    }
    $sndEndPath = "C:\Windows\Media\Windows Notify Messaging.wav"
    if (-not (Test-Path $sndEndPath)) { $sndEndPath = "C:\Windows\Media\chimes.wav" }
    if (Test-Path $sndEndPath) {
        $script:SoundPlayerEnd = New-Object System.Media.SoundPlayer $sndEndPath
        $script:SoundPlayerEnd.LoadAsync()
    }
} catch {}

function Play-SessionSound($type) {
    if (-not $script:AlarmEnabled) { return }
    try {
        if ($type -eq "Start" -and $script:SoundPlayerStart -ne $null) {
            $script:SoundPlayerStart.Play()
        } elseif ($type -eq "End" -and $script:SoundPlayerEnd -ne $null) {
            $script:SoundPlayerEnd.Play()
        } else {
            [System.Media.SystemSounds]::Asterisk.Play()
        }
    } catch {}
}

$txtHeaderTitle = $window.FindName("TxtHeaderTitle")
$txtMinIcon = $window.FindName("TxtMinIcon")
$txtCloseIcon = $window.FindName("TxtCloseIcon")

$clockBorder = $window.FindName("ClockBorder")
$ticksCanvas = $window.FindName("TicksCanvas")
$badgeAmpm = $window.FindName("BadgeAmpm")
$txtAmpm = $window.FindName("TxtAmpm")
$badgeZone = $window.FindName("BadgeZone")
$txtZone = $window.FindName("TxtZone")
$txtTime = $window.FindName("TxtTime")
$badgeSec = $window.FindName("BadgeSec")
$txtSec = $window.FindName("TxtSec")
$txtSecLabel = $window.FindName("TxtSecLabel")

$liveDot = $window.FindName("LivePulseDot")
$cardActive = $window.FindName("CardActive")
$txtActiveLabel = $window.FindName("TxtActiveLabel")
$badgeActive = $window.FindName("BadgeActive")
$txtActiveBadge = $window.FindName("TxtActiveBadge")
$txtActiveName = $window.FindName("TxtActiveName")
$txtActiveHours = $window.FindName("TxtActiveHours")
$txtActiveEndsInLabel = $window.FindName("TxtActiveEndsInLabel")
$badgeActiveCd = $window.FindName("BadgeActiveCd")
$txtActiveCountdown = $window.FindName("TxtActiveCountdown")

$cardNext = $window.FindName("CardNext")
$txtNextLabel = $window.FindName("TxtNextLabel")
$badgeNext = $window.FindName("BadgeNext")
$badgeNextText = $window.FindName("BadgeNextText")
$txtNextName = $window.FindName("TxtNextName")
$txtNextHours = $window.FindName("TxtNextHours")
$txtNextStartsInLabel = $window.FindName("TxtNextStartsInLabel")
$badgeNextCd = $window.FindName("BadgeNextCd")
$txtNextCountdown = $window.FindName("TxtNextCountdown")

$expandPanel = $window.FindName("ExpandPanel")
$expandTranslate = [System.Windows.Media.TranslateTransform]::new()
$expandPanel.RenderTransform = $expandTranslate
$txtExpandPanelHeader = $window.FindName("TxtExpandPanelHeader")
$txtExpandTzNote = $window.FindName("TxtExpandTzNote")
$borderCoreCol = $window.FindName("BorderCoreCol")
$borderSbCol = $window.FindName("BorderSbCol")
$dotS1 = $window.FindName("DotS1"); $dotS2 = $window.FindName("DotS2"); $dotS3 = $window.FindName("DotS3")
$dotS4 = $window.FindName("DotS4"); $dotS5 = $window.FindName("DotS5"); $dotS6 = $window.FindName("DotS6"); $dotS7 = $window.FindName("DotS7")
$badgeSbInfo = $window.FindName("BadgeSbInfo"); $txtSbLiveInfo = $window.FindName("TxtSbLiveInfo")
$txtS1Name = $window.FindName("TxtS1Name"); $txtS1Time = $window.FindName("TxtS1Time")
$txtS2Name = $window.FindName("TxtS2Name"); $txtS2Time = $window.FindName("TxtS2Time")
$txtS3Name = $window.FindName("TxtS3Name"); $txtS3Time = $window.FindName("TxtS3Time")
$txtS4Name = $window.FindName("TxtS4Name"); $txtS4Time = $window.FindName("TxtS4Time")
$txtS5Name = $window.FindName("TxtS5Name"); $txtS5Time = $window.FindName("TxtS5Time")
$txtS6Name = $window.FindName("TxtS6Name"); $txtS6Time = $window.FindName("TxtS6Time")
$txtS7Name = $window.FindName("TxtS7Name"); $txtS7Time = $window.FindName("TxtS7Time")

# Create 60 Precision Line elements on the Canvas
$lineElements = @()
$script:BrushActive = [System.Windows.Media.SolidColorBrush]::new([System.Windows.Media.Color]::FromRgb(255, 255, 255))
$script:BrushInactive = [System.Windows.Media.SolidColorBrush]::new([System.Windows.Media.Color]::FromArgb(40, 255, 255, 255))
$script:BrushCurrent = [System.Windows.Media.SolidColorBrush]::new([System.Windows.Media.Color]::FromRgb(52, 211, 153))

foreach ($t in $script:TicksData) {
    $line = [System.Windows.Shapes.Line]::new()
    $line.X1 = $t.X1; $line.Y1 = $t.Y1
    $line.X2 = $t.X2; $line.Y2 = $t.Y2
    $line.Stroke = $script:BrushInactive
    $line.StrokeThickness = 1.2
    $line.StrokeStartLineCap = [System.Windows.Media.PenLineCap]::Round
    $line.StrokeEndLineCap = [System.Windows.Media.PenLineCap]::Round
    $ticksCanvas.Children.Add($line) | Out-Null
    $lineElements += $line
}

# Theme Toggle Function (Apple Studio Pearl Light Mode ⇄ Apple Obsidian Pro Night Mode)
function Set-Theme($isDay) {
    $bc = [System.Windows.Media.BrushConverter]::new()
    if ($isDay) {
        # APPLE STUDIO FROSTED PEARL GLASS
        $mainCard.Background = $script:DayCardBg
        $mainCard.BorderBrush = $script:DayCardBorder
        $txtHeaderTitle.Foreground = $bc.ConvertFromString("#1E1B4B")
        $btnExpand.Background = $bc.ConvertFromString("#EDE9FE")
        $btnExpand.BorderBrush = $bc.ConvertFromString("#DDD6FE")
        $txtExpandIcon.Foreground = $bc.ConvertFromString("#4338CA")
        $btnTheme.Background = $bc.ConvertFromString("#EDE9FE")
        $btnTheme.BorderBrush = $bc.ConvertFromString("#DDD6FE")
        $txtThemeIcon.Foreground = $bc.ConvertFromString("#4338CA")
        $btnAlarm.Background = $bc.ConvertFromString("#EDE9FE")
        $btnAlarm.BorderBrush = $bc.ConvertFromString("#DDD6FE")
        $txtAlarmIcon.Foreground = if ($script:AlarmEnabled) { $bc.ConvertFromString("#059669") } else { $bc.ConvertFromString("#94A3B8") }
        $btnTz.Background = $bc.ConvertFromString("#EDE9FE")
        $btnTz.BorderBrush = $bc.ConvertFromString("#DDD6FE")
        $txtTz.Foreground = $bc.ConvertFromString("#4338CA")
        $btnMin.Background = $bc.ConvertFromString("#EDE9FE")
        $btnMin.BorderBrush = $bc.ConvertFromString("#DDD6FE")
        $txtMinIcon.Foreground = $bc.ConvertFromString("#4338CA")
        $btnClose.Background = $bc.ConvertFromString("#EDE9FE")
        $btnClose.BorderBrush = $bc.ConvertFromString("#DDD6FE")
        $txtCloseIcon.Foreground = $bc.ConvertFromString("#4338CA")

        # Clock in Light Mode
        $clockBorder.Background = $bc.ConvertFromString("#F4F8FAFC")
        $clockBorder.BorderBrush = $bc.ConvertFromString("#25000000")
        $txtTime.Foreground = $bc.ConvertFromString("#0F172A")
        $badgeAmpm.Background = $bc.ConvertFromString("#EDE9FE")
        $badgeAmpm.BorderBrush = $bc.ConvertFromString("#DDD6FE")
        $txtAmpm.Foreground = $bc.ConvertFromString("#4338CA")
        $badgeZone.Background = $bc.ConvertFromString("#E0E7FF")
        $badgeZone.BorderBrush = $bc.ConvertFromString("#C7D2FE")
        $txtZone.Foreground = $bc.ConvertFromString("#3730A3")
        $badgeSec.Background = $bc.ConvertFromString("#EDE9FE")
        $badgeSec.BorderBrush = $bc.ConvertFromString("#DDD6FE")
        $txtSec.Foreground = $bc.ConvertFromString("#7C3AED")
        $txtSecLabel.Foreground = $bc.ConvertFromString("#6D28D9")

        # Cards in Light Mode
        $cardActive.Background = $bc.ConvertFromString("#F4F8FAFC")
        $cardActive.BorderBrush = $bc.ConvertFromString("#20000000")
        $txtActiveLabel.Foreground = $bc.ConvertFromString("#4F46E5")
        $txtActiveName.Foreground = $bc.ConvertFromString("#1E1B4B")
        $txtActiveHours.Foreground = $bc.ConvertFromString("#4338CA")
        $txtActiveEndsInLabel.Foreground = $bc.ConvertFromString("#64748B")
        $badgeActiveCd.Background = $bc.ConvertFromString("#F1F5F9")
        $badgeActiveCd.BorderBrush = $bc.ConvertFromString("#E2E8F0")
        $txtActiveCountdown.Foreground = $bc.ConvertFromString("#059669")

        $cardNext.Background = $bc.ConvertFromString("#F4F8FAFC")
        $cardNext.BorderBrush = $bc.ConvertFromString("#20000000")
        $txtNextLabel.Foreground = $bc.ConvertFromString("#7C3AED")
        $txtNextName.Foreground = $bc.ConvertFromString("#1E1B4B")
        $txtNextHours.Foreground = $bc.ConvertFromString("#6366F1")
        $txtNextStartsInLabel.Foreground = $bc.ConvertFromString("#64748B")
        $badgeNextCd.Background = $bc.ConvertFromString("#F1F5F9")
        $badgeNextCd.BorderBrush = $bc.ConvertFromString("#E2E8F0")
        $txtNextCountdown.Foreground = $bc.ConvertFromString("#6D28D9")

        # Expand Panel
        $expandPanel.Background = $bc.ConvertFromString("#F4F8FAFC")
        $expandPanel.BorderBrush = $bc.ConvertFromString("#25000000")
        $txtExpandPanelHeader.Foreground = $bc.ConvertFromString("#312E81")
        if ($borderCoreCol) { $borderCoreCol.Background = $bc.ConvertFromString("#F8FAFC"); $borderCoreCol.BorderBrush = $bc.ConvertFromString("#E2E8F0") }
        if ($borderSbCol) { $borderSbCol.Background = $bc.ConvertFromString("#FFFBEB"); $borderSbCol.BorderBrush = $bc.ConvertFromString("#FCD34D") }
        if ($txtExpandTzNote) { $txtExpandTzNote.Foreground = $bc.ConvertFromString("#64748B") }
        if ($badgeSbInfo) { $badgeSbInfo.Background = $bc.ConvertFromString("#FEF3C7"); $badgeSbInfo.BorderBrush = $bc.ConvertFromString("#FCD34D") }
        $txtS1Name.Foreground = $bc.ConvertFromString("#1E1B4B"); $txtS1Time.Foreground = $bc.ConvertFromString("#4338CA")
        $txtS2Name.Foreground = $bc.ConvertFromString("#1E1B4B"); $txtS2Time.Foreground = $bc.ConvertFromString("#4338CA")
        $txtS3Name.Foreground = $bc.ConvertFromString("#D97706"); $txtS3Time.Foreground = $bc.ConvertFromString("#B45309")
        $txtS4Name.Foreground = $bc.ConvertFromString("#1E1B4B"); $txtS4Time.Foreground = $bc.ConvertFromString("#4338CA")
        $txtS5Name.Foreground = $bc.ConvertFromString("#D97706"); $txtS5Time.Foreground = $bc.ConvertFromString("#B45309")
        $txtS6Name.Foreground = $bc.ConvertFromString("#1E1B4B"); $txtS6Time.Foreground = $bc.ConvertFromString("#4338CA")
        $txtS7Name.Foreground = $bc.ConvertFromString("#D97706"); $txtS7Time.Foreground = $bc.ConvertFromString("#B45309")

        $script:BrushActive = $bc.ConvertFromString("#4F46E5")
        $script:BrushInactive = $bc.ConvertFromString("#CBD5E1")
        $script:BrushCurrent = $bc.ConvertFromString("#7C3AED")
        $txtThemeIcon.Text = [char]0x2600 # Sun icon
    } else {
        # APPLE OBSIDIAN CRYSTAL NIGHT MODE
        $mainCard.Background = $script:NightCardBg
        $mainCard.BorderBrush = $script:NightCardBorder
        $txtHeaderTitle.Foreground = $bc.ConvertFromString("#E0E7FF")
        $btnExpand.Background = $bc.ConvertFromString("#252F45")
        $btnExpand.BorderBrush = $bc.ConvertFromString("#3B4866")
        $txtExpandIcon.Foreground = $bc.ConvertFromString("#F8FAFC")
        $btnTheme.Background = $bc.ConvertFromString("#252F45")
        $btnTheme.BorderBrush = $bc.ConvertFromString("#3B4866")
        $txtThemeIcon.Foreground = $bc.ConvertFromString("#F8FAFC")
        $btnAlarm.Background = $bc.ConvertFromString("#252F45")
        $btnAlarm.BorderBrush = $bc.ConvertFromString("#3B4866")
        $txtAlarmIcon.Foreground = if ($script:AlarmEnabled) { $bc.ConvertFromString("#34D399") } else { $bc.ConvertFromString("#64748B") }
        $btnTz.Background = $bc.ConvertFromString("#252F45")
        $btnTz.BorderBrush = $bc.ConvertFromString("#3B4866")
        $txtTz.Foreground = $bc.ConvertFromString("#F8FAFC")
        $btnMin.Background = $bc.ConvertFromString("#252F45")
        $btnMin.BorderBrush = $bc.ConvertFromString("#3B4866")
        $txtMinIcon.Foreground = $bc.ConvertFromString("#F8FAFC")
        $btnClose.Background = $bc.ConvertFromString("#252F45")
        $btnClose.BorderBrush = $bc.ConvertFromString("#3B4866")
        $txtCloseIcon.Foreground = $bc.ConvertFromString("#F8FAFC")

        # Clock in Night Mode
        $clockBorder.Background = $bc.ConvertFromString("#F4131A29")
        $clockBorder.BorderBrush = $bc.ConvertFromString("#25FFFFFF")
        $txtTime.Foreground = $bc.ConvertFromString("#FFFFFF")
        $badgeAmpm.Background = $bc.ConvertFromString("#202738")
        $badgeAmpm.BorderBrush = $bc.ConvertFromString("#2C374E")
        $txtAmpm.Foreground = $bc.ConvertFromString("#E2E8F0")
        $badgeZone.Background = $bc.ConvertFromString("#1C2340")
        $badgeZone.BorderBrush = $bc.ConvertFromString("#354270")
        $txtZone.Foreground = $bc.ConvertFromString("#A5B4FC")
        $badgeSec.Background = $bc.ConvertFromString("#101420")
        $badgeSec.BorderBrush = $bc.ConvertFromString("#242D40")
        $txtSec.Foreground = $bc.ConvertFromString("#34D399")
        $txtSecLabel.Foreground = $bc.ConvertFromString("#94A3B8")

        # Cards in Night Mode
        $cardActive.Background = $bc.ConvertFromString("#F4131A29")
        $cardActive.BorderBrush = $bc.ConvertFromString("#25FFFFFF")
        $txtActiveLabel.Foreground = $bc.ConvertFromString("#A5B4FC")
        $txtActiveName.Foreground = $bc.ConvertFromString("#FFFFFF")
        $txtActiveHours.Foreground = $bc.ConvertFromString("#E2E8F0")
        $txtActiveEndsInLabel.Foreground = $bc.ConvertFromString("#94A3B8")
        $badgeActiveCd.Background = $bc.ConvertFromString("#101420")
        $badgeActiveCd.BorderBrush = $bc.ConvertFromString("#242D40")
        $txtActiveCountdown.Foreground = $bc.ConvertFromString("#34D399")

        $cardNext.Background = $bc.ConvertFromString("#F4131A29")
        $cardNext.BorderBrush = $bc.ConvertFromString("#25FFFFFF")
        $txtNextLabel.Foreground = $bc.ConvertFromString("#A5B4FC")
        $txtNextName.Foreground = $bc.ConvertFromString("#FFFFFF")
        $txtNextHours.Foreground = $bc.ConvertFromString("#E2E8F0")
        $txtNextStartsInLabel.Foreground = $bc.ConvertFromString("#94A3B8")
        $badgeNextCd.Background = $bc.ConvertFromString("#101420")
        $badgeNextCd.BorderBrush = $bc.ConvertFromString("#222B40")
        $txtNextCountdown.Foreground = $bc.ConvertFromString("#A5B4FC")

        # Expand Panel
        $expandPanel.Background = $bc.ConvertFromString("#F40E1320")
        $expandPanel.BorderBrush = $bc.ConvertFromString("#25FFFFFF")
        $txtExpandPanelHeader.Foreground = $bc.ConvertFromString("#A5B4FC")
        if ($borderCoreCol) { $borderCoreCol.Background = $bc.ConvertFromString("#121826"); $borderCoreCol.BorderBrush = $bc.ConvertFromString("#20FFFFFF") }
        if ($borderSbCol) { $borderSbCol.Background = $bc.ConvertFromString("#161722"); $borderSbCol.BorderBrush = $bc.ConvertFromString("#25FBBF24") }
        if ($txtExpandTzNote) { $txtExpandTzNote.Foreground = $bc.ConvertFromString("#94A3B8") }
        if ($badgeSbInfo) { $badgeSbInfo.Background = $bc.ConvertFromString("#1AFBBF24"); $badgeSbInfo.BorderBrush = $bc.ConvertFromString("#35FBBF24") }
        $txtS1Name.Foreground = $bc.ConvertFromString("#CBD5E1"); $txtS1Time.Foreground = $bc.ConvertFromString("#94A3B8")
        $txtS2Name.Foreground = $bc.ConvertFromString("#CBD5E1"); $txtS2Time.Foreground = $bc.ConvertFromString("#94A3B8")
        $txtS3Name.Foreground = $bc.ConvertFromString("#FBBF24"); $txtS3Time.Foreground = $bc.ConvertFromString("#FDE68A")
        $txtS4Name.Foreground = $bc.ConvertFromString("#CBD5E1"); $txtS4Time.Foreground = $bc.ConvertFromString("#94A3B8")
        $txtS5Name.Foreground = $bc.ConvertFromString("#FBBF24"); $txtS5Time.Foreground = $bc.ConvertFromString("#FDE68A")
        $txtS6Name.Foreground = $bc.ConvertFromString("#CBD5E1"); $txtS6Time.Foreground = $bc.ConvertFromString("#94A3B8")
        $txtS7Name.Foreground = $bc.ConvertFromString("#FBBF24"); $txtS7Time.Foreground = $bc.ConvertFromString("#FDE68A")

        $script:BrushActive = $bc.ConvertFromString("#818CF8")
        $script:BrushInactive = $bc.ConvertFromString("#2A344D")
        $script:BrushCurrent = $bc.ConvertFromString("#34D399")
        $txtThemeIcon.Text = [char]0x263D # Moon icon
    }
}

# Flush 4-Corner Magnetic Snapping (Margin = 2px, Flush to taskbar & edges)
function Snap-Window-To-Screen {
    try {
        $curLeft = $window.Left
        $curTop = $window.Top
        $w = $window.ActualWidth
        if ($w -le 0) { $w = 405 }
        $h = $window.ActualHeight
        if ($h -le 0) { $h = $window.Height }

        $area = [System.Windows.SystemParameters]::WorkArea
        try {
            $centerX = $curLeft + ($w / 2.0)
            $centerY = $curTop + ($h / 2.0)
            $dpiX = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds.Width / [System.Windows.SystemParameters]::PrimaryScreenWidth
            $dpiY = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds.Height / [System.Windows.SystemParameters]::PrimaryScreenHeight
            if ($dpiX -le 0) { $dpiX = 1.0 }
            if ($dpiY -le 0) { $dpiY = 1.0 }

            $screen = [System.Windows.Forms.Screen]::FromPoint([System.Drawing.Point]::new([int]($centerX * $dpiX), [int]($centerY * $dpiY)))
            if ($screen -ne $null -and $screen.WorkingArea -ne $null) {
                $wa = $screen.WorkingArea
                $area = [PSCustomObject]@{
                    Left   = $wa.Left / $dpiX
                    Top    = $wa.Top / $dpiY
                    Right  = $wa.Right / $dpiX
                    Bottom = $wa.Bottom / $dpiY
                }
            }
        } catch {}

        $snapThreshold = 90 # 90px strong magnetic attraction zone
        $margin = 2         # FLUSH to corner and taskbar!

        $targetLeft = $curLeft
        $targetTop = $curTop

        # Left snap
        if ([Math]::Abs($curLeft - ($area.Left + $margin)) -lt $snapThreshold -or $curLeft -lt ($area.Left + $snapThreshold)) {
            $targetLeft = $area.Left + $margin
        }
        # Right snap
        elseif ([Math]::Abs(($curLeft + $w) - ($area.Right - $margin)) -lt $snapThreshold -or ($curLeft + $w) -gt ($area.Right - $snapThreshold)) {
            $targetLeft = $area.Right - $w - $margin
        }

        # Top snap
        if ([Math]::Abs($curTop - ($area.Top + $margin)) -lt $snapThreshold -or $curTop -lt ($area.Top + $snapThreshold)) {
            $targetTop = $area.Top + $margin
        }
        # Bottom snap
        elseif ([Math]::Abs(($curTop + $h) - ($area.Bottom - $margin)) -lt $snapThreshold -or ($curTop + $h) -gt ($area.Bottom - $snapThreshold)) {
            $targetTop = $area.Bottom - $h - $margin
        }

        $window.Left = [Math]::Round($targetLeft)
        $window.Top = [Math]::Round($targetTop)
    } catch {}
}

# Crash-Proof Drag Handler (Excludes all buttons and interactive elements)
$window.Add_MouseLeftButtonDown({
    param($s, $e)
    if ($e.ChangedButton -ne [System.Windows.Input.MouseButton]::Left) { return }

    # Walk visual tree to verify click didn't start on an interactive button
    $curr = $e.OriginalSource
    while ($curr -ne $null -and $curr -ne $window) {
        if ($curr -eq $btnExpand -or $curr -eq $btnTheme -or $curr -eq $btnAlarm -or $curr -eq $btnTz -or $curr -eq $btnMin -or $curr -eq $btnClose) {
            return
        }
        if ($curr -is [System.Windows.Media.Visual] -or $curr -is [System.Windows.Media.Media3D.Visual3D]) {
            $curr = [System.Windows.Media.VisualTreeHelper]::GetParent($curr)
        } else {
            break
        }
    }

    if ($e.ButtonState -eq [System.Windows.Input.MouseButtonState]::Pressed) {
        try {
            $window.DragMove()
            Snap-Window-To-Screen
        } catch {}
    }
})

$headerBar.Add_MouseLeftButtonDown({
    param($s, $e)
    if ($e.ChangedButton -ne [System.Windows.Input.MouseButton]::Left) { return }
    $curr = $e.OriginalSource
    while ($curr -ne $null -and $curr -ne $headerBar) {
        if ($curr -eq $btnExpand -or $curr -eq $btnTheme -or $curr -eq $btnAlarm -or $curr -eq $btnTz -or $curr -eq $btnMin -or $curr -eq $btnClose) {
            return
        }
        if ($curr -is [System.Windows.Media.Visual]) {
            $curr = [System.Windows.Media.VisualTreeHelper]::GetParent($curr)
        } else { break }
    }
    try {
        $window.DragMove()
        Snap-Window-To-Screen
    } catch {}
})

# Native Window Controls
$btnTheme.Add_MouseLeftButtonDown({
    param($s, $e)
    $e.Handled = $true
    $script:IsDayTheme = -not $script:IsDayTheme
    Set-Theme $script:IsDayTheme
})

# Session Alarm Audio Alert Toggle
$btnAlarm.Add_MouseLeftButtonDown({
    param($s, $e)
    $e.Handled = $true
    $script:AlarmEnabled = -not $script:AlarmEnabled
    $bc = [System.Windows.Media.BrushConverter]::new()
    if ($script:AlarmEnabled) {
        $txtAlarmIcon.Text = [char]::ConvertFromUtf32(0x1F514)
        $txtAlarmIcon.Foreground = if ($script:IsDayTheme) { $bc.ConvertFromString("#059669") } else { $bc.ConvertFromString("#34D399") }
        $btnAlarm.ToolTip = "Session Alarm: ON (Click to Mute)"
        Play-SessionSound "Start"
    } else {
        $txtAlarmIcon.Text = [char]::ConvertFromUtf32(0x1F515)
        $txtAlarmIcon.Foreground = if ($script:IsDayTheme) { $bc.ConvertFromString("#94A3B8") } else { $bc.ConvertFromString("#64748B") }
        $btnAlarm.ToolTip = "Session Alarm: MUTED (Click to Enable)"
    }
})

# Smooth 60fps Easing Animation for Expand / Collapse
$script:IsAnimating = $false
$script:AnimTimer = New-Object System.Windows.Threading.DispatcherTimer
$script:AnimTimer.Interval = [TimeSpan]::FromMilliseconds(13)

$script:AnimStart = [DateTime]::MinValue
$script:AnimDurationMs = 240
$script:AnimStartH = 0
$script:AnimTargetH = 0
$script:AnimBottomAnchor = 0
$script:AnimExpanding = $true

$script:AnimTimer.Add_Tick({
    $elapsed = ([DateTime]::UtcNow - $script:AnimStart).TotalMilliseconds
    $p = [Math]::Min(1.0, ($elapsed / $script:AnimDurationMs))
    
    # Smooth Cubic Ease-Out: 1 - (1 - t)^3
    $ease = 1.0 - [Math]::Pow(1.0 - $p, 3)
    
    $curH = $script:AnimStartH + ($script:AnimTargetH - $script:AnimStartH) * $ease
    $window.Height = $curH
    $window.Top = $script:AnimBottomAnchor - $curH
    
    if ($script:AnimExpanding) {
        $expandPanel.Opacity = $ease
        if ($expandTranslate -ne $null) {
            $expandTranslate.Y = (1.0 - $ease) * -8.0
        }
    } else {
        $expandPanel.Opacity = (1.0 - $ease)
        if ($expandTranslate -ne $null) {
            $expandTranslate.Y = $ease * -8.0
        }
    }
    
    if ($p -ge 1.0) {
        $script:AnimTimer.Stop()
        $script:IsAnimating = $false
        $window.Height = $script:AnimTargetH
        $window.Top = $script:AnimBottomAnchor - $script:AnimTargetH
        if (-not $script:AnimExpanding) {
            $expandPanel.Visibility = [System.Windows.Visibility]::Collapsed
            $txtExpandIcon.Text = [char]0x25BE + " ALL"
        } else {
            $expandPanel.Opacity = 1.0
            if ($expandTranslate -ne $null) { $expandTranslate.Y = 0 }
            $txtExpandIcon.Text = [char]0x25B4 + " LESS"
        }
        Snap-Window-To-Screen
    }
})

# Expand / Collapse Sessions View
$btnExpand.Add_MouseLeftButtonDown({
    param($s, $e)
    $e.Handled = $true
    if ($script:IsAnimating) { return }
    
    $script:IsExpanded = -not $script:IsExpanded
    $script:IsAnimating = $true
    $script:AnimStart = [DateTime]::UtcNow
    $script:AnimStartH = $window.Height
    $script:AnimBottomAnchor = $window.Top + $window.Height
    
    if ($script:IsExpanded) {
        $script:AnimExpanding = $true
        $script:AnimTargetH = $expandedH
        $expandPanel.Opacity = 0.0
        if ($expandTranslate -ne $null) { $expandTranslate.Y = -8.0 }
        $expandPanel.Visibility = [System.Windows.Visibility]::Visible
        $txtExpandIcon.Text = [char]0x25B4 + " LESS"
    } else {
        $script:AnimExpanding = $false
        $script:AnimTargetH = $winH
    }
    $script:AnimTimer.Start()
})

$btnMin.Add_MouseLeftButtonDown({
    param($s, $e)
    $e.Handled = $true
    $window.WindowState = [System.Windows.WindowState]::Minimized
})

$btnClose.Add_MouseLeftButtonDown({
    param($s, $e)
    $e.Handled = $true
    $window.Close()
})

# Hover effects on buttons
$btnTheme.Add_MouseEnter({ $btnTheme.Opacity = 0.75 })
$btnTheme.Add_MouseLeave({ $btnTheme.Opacity = 1.0 })
$btnAlarm.Add_MouseEnter({ $btnAlarm.Opacity = 0.75 })
$btnAlarm.Add_MouseLeave({ $btnAlarm.Opacity = 1.0 })
$btnExpand.Add_MouseEnter({ $btnExpand.Opacity = 0.75 })
$btnExpand.Add_MouseLeave({ $btnExpand.Opacity = 1.0 })
$btnTz.Add_MouseEnter({ $btnTz.Opacity = 0.75 })
$btnTz.Add_MouseLeave({ $btnTz.Opacity = 1.0 })
$btnMin.Add_MouseEnter({ $btnMin.Opacity = 0.75 })
$btnMin.Add_MouseLeave({ $btnMin.Opacity = 1.0 })
$btnClose.Add_MouseEnter({ $btnClose.Background = [System.Windows.Media.SolidColorBrush]::new([System.Windows.Media.Color]::FromRgb(225, 29, 72)) })
$btnClose.Add_MouseLeave({ 
    $bc = [System.Windows.Media.BrushConverter]::new()
    $btnClose.Background = if ($script:IsDayTheme) { $bc.ConvertFromString("#EDE9FE") } else { $bc.ConvertFromString("#1E2536") }
})

# Timezone Toggle
$btnTz.Add_MouseLeftButtonDown({
    param($s, $e)
    $e.Handled = $true
    $script:UseNy = -not $script:UseNy
    if ($script:UseNy) {
        $txtTz.Text = "NY"
        $txtZone.Text = "NY TIME"
    } else {
        $txtTz.Text = "LOC"
        $txtZone.Text = "LOCAL"
    }
})

function Format-Timer($secs) {
    if ($secs -lt 0) { $secs = 0 }
    $hh = [Math]::Floor($secs / 3600)
    $mm = [Math]::Floor(($secs % 3600) / 60)
    $ss = [Math]::Floor($secs % 60)
    return ("{0:D2}:{1:D2}:{2:D2}" -f [int]$hh, [int]$mm, [int]$ss)
}

function Format-ZoneHour($nyH, $nyM, $useNy, $nowUtc, $tzNy) {
    if ($useNy) {
        return ("{0:D2}:{1:D2}" -f [int]($nyH % 24), [int]$nyM)
    }
    $nowNy = [System.TimeZoneInfo]::ConvertTimeFromUtc($nowUtc, $tzNy)
    $targetNy = [DateTime]::new($nowNy.Year, $nowNy.Month, $nowNy.Day, ($nyH % 24), $nyM, 0)
    $diff = [DateTime]::Now - $nowNy
    $localTarget = $targetNy.Add($diff)
    return $localTarget.ToString("HH:mm")
}

# Main Tick Function
$tzNy = [System.TimeZoneInfo]::FindSystemTimeZoneById("Eastern Standard Time")

$dispatcherTimer = New-Object System.Windows.Threading.DispatcherTimer
$dispatcherTimer.Interval = [TimeSpan]::FromMilliseconds(500)
$dispatcherTimer.Add_Tick({
    try {
        $nowUtc = [DateTime]::UtcNow
        $nowNy = [System.TimeZoneInfo]::ConvertTimeFromUtc($nowUtc, $tzNy)
        $nowLocal = [DateTime]::Now
        $nowDisp = if ($script:UseNy) { $nowNy } else { $nowLocal }

        $sec = $nowDisp.Second
        $txtTime.Text = $nowDisp.ToString("hh:mm")
        $txtSec.Text = ("{0:D2}" -f $sec)
        $txtAmpm.Text = $nowDisp.ToString("tt").ToUpper()

        # Update 60 Perimeter Ticks
        for ($i = 0; $i -lt 60; $i++) {
            $line = $lineElements[$i]
            if ($i -eq $sec) {
                $line.Stroke = $script:BrushCurrent
                $line.StrokeThickness = 2.4
            } elseif ($i -lt $sec) {
                $line.Stroke = $script:BrushActive
                $line.StrokeThickness = 1.8
            } else {
                $line.Stroke = $script:BrushInactive
                $line.StrokeThickness = 1.2
            }
        }

        # Session State Calculation
        $totalSec = $nowNy.Hour * 3600 + $nowNy.Minute * 60 + $nowNy.Second
        $toSec = { param($h, $m) return $h * 3600 + $m * 60 }

        $activeName = "Off-Hours"
        $isLive = $false
        $isSb = $false
        $bulletName = ""
        $activeEndsIn = 0
        $hStart1 = 0; $hEnd1 = 0

        $nextName = "London Open"
        $nextStartsIn = 0
        $hStart2 = 0; $hEnd2 = 0

        if ($totalSec -ge (& $toSec 0 0) -and $totalSec -lt (& $toSec 2 0)) {
            $activeName = "Off-Hours (Pre-London)"
            $activeEndsIn = (& $toSec 2 0) - $totalSec
            $nextName = "London Open"
            $nextStartsIn = (& $toSec 2 0) - $totalSec
            $hStart2 = 2; $hEnd2 = 5
        } elseif ($totalSec -ge (& $toSec 2 0) -and $totalSec -lt (& $toSec 3 0)) {
            $activeName = "London Open"
            $isLive = $true
            $activeEndsIn = (& $toSec 5 0) - $totalSec
            $hStart1 = 2; $hEnd1 = 5
            $nextName = "London Silver Bullet (SB)"
            $nextStartsIn = (& $toSec 3 0) - $totalSec
            $hStart2 = 3; $hEnd2 = 4
        } elseif ($totalSec -ge (& $toSec 3 0) -and $totalSec -lt (& $toSec 4 0)) {
            $activeName = "London Silver Bullet (SB)"
            $isLive = $true
            $isSb = $true
            $bulletName = "London Silver Bullet (SB)"
            $activeEndsIn = (& $toSec 4 0) - $totalSec
            $hStart1 = 3; $hEnd1 = 4
            $nextName = "New York AM"
            $nextStartsIn = (& $toSec 7 0) - $totalSec
            $hStart2 = 7; $hEnd2 = 12
        } elseif ($totalSec -ge (& $toSec 4 0) -and $totalSec -lt (& $toSec 5 0)) {
            $activeName = "London Open"
            $isLive = $true
            $activeEndsIn = (& $toSec 5 0) - $totalSec
            $hStart1 = 2; $hEnd1 = 5
            $nextName = "New York AM"
            $nextStartsIn = (& $toSec 7 0) - $totalSec
            $hStart2 = 7; $hEnd2 = 12
        } elseif ($totalSec -ge (& $toSec 5 0) -and $totalSec -lt (& $toSec 7 0)) {
            $activeName = "Off-Hours (Pre-NY)"
            $activeEndsIn = (& $toSec 7 0) - $totalSec
            $nextName = "New York AM"
            $nextStartsIn = (& $toSec 7 0) - $totalSec
            $hStart2 = 7; $hEnd2 = 12
        } elseif ($totalSec -ge (& $toSec 7 0) -and $totalSec -lt (& $toSec 10 0)) {
            $activeName = "New York AM"
            $isLive = $true
            $activeEndsIn = (& $toSec 12 0) - $totalSec
            $hStart1 = 7; $hEnd1 = 12
            $nextName = "NY AM Silver Bullet (SB)"
            $nextStartsIn = (& $toSec 10 0) - $totalSec
            $hStart2 = 10; $hEnd2 = 11
        } elseif ($totalSec -ge (& $toSec 10 0) -and $totalSec -lt (& $toSec 11 0)) {
            $activeName = "NY AM Silver Bullet (SB)"
            $isLive = $true
            $isSb = $true
            $bulletName = "NY AM Silver Bullet (SB)"
            $activeEndsIn = (& $toSec 11 0) - $totalSec
            $hStart1 = 10; $hEnd1 = 11
            $nextName = "NY PM Silver Bullet (SB)"
            $nextStartsIn = (& $toSec 14 0) - $totalSec
            $hStart2 = 14; $hEnd2 = 15
        } elseif ($totalSec -ge (& $toSec 11 0) -and $totalSec -lt (& $toSec 12 0)) {
            $activeName = "New York AM"
            $isLive = $true
            $activeEndsIn = (& $toSec 12 0) - $totalSec
            $hStart1 = 7; $hEnd1 = 12
            $nextName = "NY PM Silver Bullet (SB)"
            $nextStartsIn = (& $toSec 14 0) - $totalSec
            $hStart2 = 14; $hEnd2 = 15
        } elseif ($totalSec -ge (& $toSec 12 0) -and $totalSec -lt (& $toSec 13 0)) {
            $activeName = "Off-Hours (Lunch)"
            $activeEndsIn = (& $toSec 13 0) - $totalSec
            $nextName = "NY PM Silver Bullet (SB)"
            $nextStartsIn = (& $toSec 14 0) - $totalSec
            $hStart2 = 14; $hEnd2 = 15
        } elseif ($totalSec -ge (& $toSec 13 0) -and $totalSec -lt (& $toSec 14 0)) {
            $activeName = "New York PM"
            $isLive = $true
            $activeEndsIn = (& $toSec 16 0) - $totalSec
            $hStart1 = 13; $hEnd1 = 16
            $nextName = "NY PM Silver Bullet (SB)"
            $nextStartsIn = (& $toSec 14 0) - $totalSec
            $hStart2 = 14; $hEnd2 = 15
        } elseif ($totalSec -ge (& $toSec 14 0) -and $totalSec -lt (& $toSec 15 0)) {
            $activeName = "NY PM Silver Bullet (SB)"
            $isLive = $true
            $isSb = $true
            $bulletName = "NY PM Silver Bullet (SB)"
            $activeEndsIn = (& $toSec 15 0) - $totalSec
            $hStart1 = 14; $hEnd1 = 15
            $nextName = "Asian Session"
            $nextStartsIn = (& $toSec 20 0) - $totalSec
            $hStart2 = 20; $hEnd2 = 24
        } elseif ($totalSec -ge (& $toSec 15 0) -and $totalSec -lt (& $toSec 16 0)) {
            $activeName = "New York PM"
            $isLive = $true
            $activeEndsIn = (& $toSec 16 0) - $totalSec
            $hStart1 = 13; $hEnd1 = 16
            $nextName = "Asian Session"
            $nextStartsIn = (& $toSec 20 0) - $totalSec
            $hStart2 = 20; $hEnd2 = 24
        } elseif ($totalSec -ge (& $toSec 16 0) -and $totalSec -lt (& $toSec 20 0)) {
            $activeName = "Off-Hours (Post-NY)"
            $activeEndsIn = (& $toSec 20 0) - $totalSec
            $nextName = "Asian Session"
            $nextStartsIn = (& $toSec 20 0) - $totalSec
            $hStart2 = 20; $hEnd2 = 24
        } else {
            $activeName = "Asian Session"
            $isLive = $true
            $activeEndsIn = (& $toSec 24 0) - $totalSec
            $hStart1 = 20; $hEnd1 = 24
            $nextName = "London Open"
            $nextStartsIn = ((& $toSec 24 0) - $totalSec) + (& $toSec 2 0)
            $hStart2 = 2; $hEnd2 = 5
        }

        # Update Active Card UI
        $bcTick = [System.Windows.Media.BrushConverter]::new()
        if ($isSb) {
            $txtActiveName.Text = $bulletName
            $txtActiveBadge.Text = "SILVER BULLET (SB)"
            if ($script:IsDayTheme) {
                $cardActive.Background = $bcTick.ConvertFromString("#FFFBEB")
                $cardActive.BorderBrush = $bcTick.ConvertFromString("#F59E0B")
                $txtActiveLabel.Foreground = $bcTick.ConvertFromString("#B45309")
                $txtActiveName.Foreground = $bcTick.ConvertFromString("#78350F")
                $badgeActive.Background = $bcTick.ConvertFromString("#F59E0B")
                $badgeActive.BorderBrush = $bcTick.ConvertFromString("#D97706")
                $txtActiveBadge.Foreground = $bcTick.ConvertFromString("#000000")
                $badgeActiveCd.Background = $bcTick.ConvertFromString("#FEF3C7")
                $badgeActiveCd.BorderBrush = $bcTick.ConvertFromString("#FCD34D")
                $txtActiveCountdown.Foreground = $bcTick.ConvertFromString("#D97706")
            } else {
                $cardActive.Background = $bcTick.ConvertFromString("#F4241A0B")
                $cardActive.BorderBrush = $bcTick.ConvertFromString("#F59E0B")
                $txtActiveLabel.Foreground = $bcTick.ConvertFromString("#FBBF24")
                $txtActiveName.Foreground = $bcTick.ConvertFromString("#FDE68A")
                $badgeActive.Background = $bcTick.ConvertFromString("#F59E0B")
                $badgeActive.BorderBrush = $bcTick.ConvertFromString("#F59E0B")
                $txtActiveBadge.Foreground = $bcTick.ConvertFromString("#000000")
                $badgeActiveCd.Background = $bcTick.ConvertFromString("#1C1304")
                $badgeActiveCd.BorderBrush = $bcTick.ConvertFromString("#80F59E0B")
                $txtActiveCountdown.Foreground = $bcTick.ConvertFromString("#FBBF24")
            }
        } elseif ($isLive) {
            $txtActiveName.Text = $activeName
            $txtActiveBadge.Text = "ACTIVE"
            if ($script:IsDayTheme) {
                $cardActive.Background = $bcTick.ConvertFromString("#F0FDF4")
                $cardActive.BorderBrush = $bcTick.ConvertFromString("#20000000")
                $txtActiveLabel.Foreground = $bcTick.ConvertFromString("#4F46E5")
                $txtActiveName.Foreground = $bcTick.ConvertFromString("#1E1B4B")
                $badgeActive.Background = $bcTick.ConvertFromString("#ECFDF5")
                $badgeActive.BorderBrush = $bcTick.ConvertFromString("#A7F3D0")
                $txtActiveBadge.Foreground = $bcTick.ConvertFromString("#059669")
                $badgeActiveCd.Background = $bcTick.ConvertFromString("#F1F5F9")
                $badgeActiveCd.BorderBrush = $bcTick.ConvertFromString("#E2E8F0")
                $txtActiveCountdown.Foreground = $bcTick.ConvertFromString("#059669")
            } else {
                $cardActive.Background = $bcTick.ConvertFromString("#F4121E19")
                $cardActive.BorderBrush = $bcTick.ConvertFromString("#25FFFFFF")
                $txtActiveLabel.Foreground = $bcTick.ConvertFromString("#A5B4FC")
                $txtActiveName.Foreground = $bcTick.ConvertFromString("#FFFFFF")
                $badgeActive.Background = $bcTick.ConvertFromString("#1A2D24")
                $badgeActive.BorderBrush = $bcTick.ConvertFromString("#2D6A4F")
                $txtActiveBadge.Foreground = $bcTick.ConvertFromString("#34D399")
                $badgeActiveCd.Background = $bcTick.ConvertFromString("#101420")
                $badgeActiveCd.BorderBrush = $bcTick.ConvertFromString("#35242D40")
                $txtActiveCountdown.Foreground = $bcTick.ConvertFromString("#34D399")
            }
        } else {
            $txtActiveName.Text = $activeName
            $txtActiveBadge.Text = "OFF-HOURS"
            if ($script:IsDayTheme) {
                $cardActive.Background = $bcTick.ConvertFromString("#F4F8FAFC")
                $cardActive.BorderBrush = $bcTick.ConvertFromString("#20000000")
                $txtActiveLabel.Foreground = $bcTick.ConvertFromString("#4F46E5")
                $txtActiveName.Foreground = $bcTick.ConvertFromString("#1E1B4B")
                $badgeActive.Background = $bcTick.ConvertFromString("#F1F5F9")
                $badgeActive.BorderBrush = $bcTick.ConvertFromString("#E2E8F0")
                $txtActiveBadge.Foreground = $bcTick.ConvertFromString("#6366F1")
                $badgeActiveCd.Background = $bcTick.ConvertFromString("#F1F5F9")
                $badgeActiveCd.BorderBrush = $bcTick.ConvertFromString("#E2E8F0")
                $txtActiveCountdown.Foreground = $bcTick.ConvertFromString("#4338CA")
            } else {
                $cardActive.Background = $bcTick.ConvertFromString("#F4111624")
                $cardActive.BorderBrush = $bcTick.ConvertFromString("#20FFFFFF")
                $txtActiveLabel.Foreground = $bcTick.ConvertFromString("#A5B4FC")
                $txtActiveName.Foreground = $bcTick.ConvertFromString("#FFFFFF")
                $badgeActive.Background = $bcTick.ConvertFromString("#1A2030")
                $badgeActive.BorderBrush = $bcTick.ConvertFromString("#283248")
                $txtActiveBadge.Foreground = $bcTick.ConvertFromString("#94A3B8")
                $badgeActiveCd.Background = $bcTick.ConvertFromString("#101420")
                $badgeActiveCd.BorderBrush = $bcTick.ConvertFromString("#35202738")
                $txtActiveCountdown.Foreground = $bcTick.ConvertFromString("#E2E8F0")
            }
        }

        if ($hEnd1 -gt 0) {
            $txtActiveHours.Text = (Format-ZoneHour $hStart1 0 $script:UseNy $nowUtc $tzNy) + " - " + (Format-ZoneHour $hEnd1 0 $script:UseNy $nowUtc $tzNy)
        } else {
            $txtActiveHours.Text = "Market Quiet"
        }
        $txtActiveCountdown.Text = Format-Timer $activeEndsIn

        # Update Upcoming Card UI
        $txtNextName.Text = $nextName
        $txtNextHours.Text = (Format-ZoneHour $hStart2 0 $script:UseNy $nowUtc $tzNy) + " - " + (Format-ZoneHour $hEnd2 0 $script:UseNy $nowUtc $tzNy)
        $txtNextCountdown.Text = Format-Timer $nextStartsIn

        $isNextSb = ($nextName -like "*Silver Bullet*")
        if ($isNextSb) {
            if ($badgeNextText) { $badgeNextText.Text = "UPCOMING (SB)" }
            if ($script:IsDayTheme) {
                $cardNext.Background = $bcTick.ConvertFromString("#FFFBEB")
                $cardNext.BorderBrush = $bcTick.ConvertFromString("#FCD34D")
                $txtNextLabel.Foreground = $bcTick.ConvertFromString("#B45309")
                $badgeNext.Background = $bcTick.ConvertFromString("#FEF3C7")
                $badgeNext.BorderBrush = $bcTick.ConvertFromString("#FCD34D")
                if ($badgeNextText) { $badgeNextText.Foreground = $bcTick.ConvertFromString("#D97706") }
                $badgeNextCd.Background = $bcTick.ConvertFromString("#FEF3C7")
                $badgeNextCd.BorderBrush = $bcTick.ConvertFromString("#FCD34D")
                $txtNextCountdown.Foreground = $bcTick.ConvertFromString("#D97706")
            } else {
                $cardNext.Background = $bcTick.ConvertFromString("#F4241A0B")
                $cardNext.BorderBrush = $bcTick.ConvertFromString("#D97706")
                $txtNextLabel.Foreground = $bcTick.ConvertFromString("#FBBF24")
                $badgeNext.Background = $bcTick.ConvertFromString("#33F59E0B")
                $badgeNext.BorderBrush = $bcTick.ConvertFromString("#66FBBF24")
                if ($badgeNextText) { $badgeNextText.Foreground = $bcTick.ConvertFromString("#FBBF24") }
                $badgeNextCd.Background = $bcTick.ConvertFromString("#1A1205")
                $badgeNextCd.BorderBrush = $bcTick.ConvertFromString("#66FBBF24")
                $txtNextCountdown.Foreground = $bcTick.ConvertFromString("#FBBF24")
            }
        } else {
            if ($badgeNextText) { $badgeNextText.Text = "UPCOMING" }
            if ($script:IsDayTheme) {
                $cardNext.Background = $bcTick.ConvertFromString("#F4F8FAFC")
                $cardNext.BorderBrush = $bcTick.ConvertFromString("#20000000")
                $txtNextLabel.Foreground = $bcTick.ConvertFromString("#7C3AED")
                $badgeNext.Background = $bcTick.ConvertFromString("#EDE9FE")
                $badgeNext.BorderBrush = $bcTick.ConvertFromString("#C4B5FD")
                if ($badgeNextText) { $badgeNextText.Foreground = $bcTick.ConvertFromString("#7C3AED") }
                $badgeNextCd.Background = $bcTick.ConvertFromString("#F1F5F9")
                $badgeNextCd.BorderBrush = $bcTick.ConvertFromString("#E2E8F0")
                $txtNextCountdown.Foreground = $bcTick.ConvertFromString("#6D28D9")
            } else {
                $cardNext.Background = $bcTick.ConvertFromString("#F4131A29")
                $cardNext.BorderBrush = $bcTick.ConvertFromString("#25FFFFFF")
                $txtNextLabel.Foreground = $bcTick.ConvertFromString("#A5B4FC")
                $badgeNext.Background = $bcTick.ConvertFromString("#1C2340")
                $badgeNext.BorderBrush = $bcTick.ConvertFromString("#354270")
                if ($badgeNextText) { $badgeNextText.Foreground = $bcTick.ConvertFromString("#A5B4FC") }
                $badgeNextCd.Background = $bcTick.ConvertFromString("#101420")
                $badgeNextCd.BorderBrush = $bcTick.ConvertFromString("#222B40")
                $txtNextCountdown.Foreground = $bcTick.ConvertFromString("#A5B4FC")
            }
        }

        # Update Expand Panel Times dynamically
        $txtS1Time.Text = (Format-ZoneHour 20 0 $script:UseNy $nowUtc $tzNy) + " - " + (Format-ZoneHour 24 0 $script:UseNy $nowUtc $tzNy)
        $txtS2Time.Text = (Format-ZoneHour 2 0 $script:UseNy $nowUtc $tzNy) + " - " + (Format-ZoneHour 5 0 $script:UseNy $nowUtc $tzNy)
        $txtS3Time.Text = (Format-ZoneHour 3 0 $script:UseNy $nowUtc $tzNy) + " - " + (Format-ZoneHour 4 0 $script:UseNy $nowUtc $tzNy)
        $txtS4Time.Text = (Format-ZoneHour 7 0 $script:UseNy $nowUtc $tzNy) + " - " + (Format-ZoneHour 12 0 $script:UseNy $nowUtc $tzNy)
        $txtS5Time.Text = (Format-ZoneHour 10 0 $script:UseNy $nowUtc $tzNy) + " - " + (Format-ZoneHour 11 0 $script:UseNy $nowUtc $tzNy)
        $txtS6Time.Text = (Format-ZoneHour 13 0 $script:UseNy $nowUtc $tzNy) + " - " + (Format-ZoneHour 16 0 $script:UseNy $nowUtc $tzNy)
        $txtS7Time.Text = (Format-ZoneHour 14 0 $script:UseNy $nowUtc $tzNy) + " - " + (Format-ZoneHour 15 0 $script:UseNy $nowUtc $tzNy)

        # Update Live Session Indicators
        $activeDotBrush = if ($script:IsDayTheme) { $bcTick.ConvertFromString("#059669") } else { $bcTick.ConvertFromString("#10B981") }
        $sbDotBrush = if ($script:IsDayTheme) { $bcTick.ConvertFromString("#D97706") } else { $bcTick.ConvertFromString("#F59E0B") }
        $inactiveDotBrush = if ($script:IsDayTheme) { $bcTick.ConvertFromString("#CBD5E1") } else { $bcTick.ConvertFromString("#475569") }
        
        $isAsianActive = ($totalSec -ge (& $toSec 20 0) -or $totalSec -lt (& $toSec 0 0))
        $isLondonActive = ($totalSec -ge (& $toSec 2 0) -and $totalSec -lt (& $toSec 5 0))
        $isLondonSbActive = ($totalSec -ge (& $toSec 3 0) -and $totalSec -lt (& $toSec 4 0))
        $isNyAmActive = ($totalSec -ge (& $toSec 7 0) -and $totalSec -lt (& $toSec 12 0))
        $isNyAmSbActive = ($totalSec -ge (& $toSec 10 0) -and $totalSec -lt (& $toSec 11 0))
        $isNyPmActive = ($totalSec -ge (& $toSec 13 0) -and $totalSec -lt (& $toSec 16 0))
        $isNyPmSbActive = ($totalSec -ge (& $toSec 14 0) -and $totalSec -lt (& $toSec 15 0))

        if ($dotS1) { $dotS1.Fill = if ($isAsianActive) { $activeDotBrush } else { $inactiveDotBrush } }
        if ($dotS2) { $dotS2.Fill = if ($isLondonActive) { $activeDotBrush } else { $inactiveDotBrush } }
        if ($dotS3) { $dotS3.Fill = if ($isLondonSbActive) { $sbDotBrush } else { $inactiveDotBrush } }
        if ($dotS4) { $dotS4.Fill = if ($isNyAmActive) { $activeDotBrush } else { $inactiveDotBrush } }
        if ($dotS5) { $dotS5.Fill = if ($isNyAmSbActive) { $sbDotBrush } else { $inactiveDotBrush } }
        if ($dotS6) { $dotS6.Fill = if ($isNyPmActive) { $activeDotBrush } else { $inactiveDotBrush } }
        if ($dotS7) { $dotS7.Fill = if ($isNyPmSbActive) { $sbDotBrush } else { $inactiveDotBrush } }

        if ($txtExpandTzNote) {
            $txtExpandTzNote.Text = if ($script:UseNy) { "NY TIME" } else { "LOCAL TIME" }
        }

        if ($txtSbLiveInfo) {
            if ($isLondonSbActive) {
                $txtSbLiveInfo.Text = "[ACTIVE] LONDON SB LIVE!"
                $txtSbLiveInfo.Foreground = $sbDotBrush
            } elseif ($isNyAmSbActive) {
                $txtSbLiveInfo.Text = "[ACTIVE] NY AM SB LIVE!"
                $txtSbLiveInfo.Foreground = $sbDotBrush
            } elseif ($isNyPmSbActive) {
                $txtSbLiveInfo.Text = "[ACTIVE] NY PM SB LIVE!"
                $txtSbLiveInfo.Foreground = $sbDotBrush
            } elseif ($isNextSb) {
                $txtSbLiveInfo.Text = "Next SB: in " + (Format-Timer $nextStartsIn)
                $txtSbLiveInfo.Foreground = if ($script:IsDayTheme) { $bcTick.ConvertFromString("#4F46E5") } else { $bcTick.ConvertFromString("#A5B4FC") }
            } else {
                $txtSbLiveInfo.Text = "1H Institutional Window"
                $txtSbLiveInfo.Foreground = if ($script:IsDayTheme) { $bcTick.ConvertFromString("#B45309") } else { $bcTick.ConvertFromString("#FDE68A") }
            }
        }

        # Session Transition Detection & Audio Alarm Trigger
        $currentSessionState = if ($isSb) { $bulletName } elseif ($isLive) { $activeName } else { "Off-Hours" }

        if ($script:LastSessionState -eq $null) {
            # Initial boot: set initial state without triggering alarm
            $script:LastSessionState = $currentSessionState
        } elseif ($script:LastSessionState -ne $currentSessionState) {
            $prev = $script:LastSessionState
            $curr = $currentSessionState
            $script:LastSessionState = $curr

            if ($curr -ne "Off-Hours") {
                # A session or Silver Bullet just STARTED!
                Play-SessionSound "Start"
                $script:ToastTicks = 14 # 14 * 500ms = 7 seconds
                $script:ToastMsg = [char]::ConvertFromUtf32(0x1F514) + " START: " + $curr
            } else {
                # A session just ENDED!
                Play-SessionSound "End"
                $script:ToastTicks = 14 # 7 seconds
                $script:ToastMsg = "⏱ END: " + $prev
            }
        }

        # Visual Header Toast & Pulse indicator during alert
        if ($script:ToastTicks -gt 0) {
            $script:ToastTicks--
            $txtHeaderTitle.Text = $script:ToastMsg
            $liveDot.Fill = if ($script:ToastTicks % 2 -eq 0) {
                $bcTick.ConvertFromString("#F59E0B")
            } else {
                $bcTick.ConvertFromString("#10B981")
            }
        } else {
            $txtHeaderTitle.Text = "FOREX & ICT STANDBY"
            $liveDot.Fill = $bcTick.ConvertFromString("#10B981")
        }
    } catch {}
})

$window.Add_Closed({
    Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
})

$dispatcherTimer.Start()
$window.ShowDialog() | Out-Null
