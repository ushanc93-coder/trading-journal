# Forex & ICT Native StandBy Desktop Widget
# Features: Compact Proportional Cards (No Dead Space), Luxury Professional Typography (Non-bold),
# True Working Magnetic 4-Corner Snapping (DIP-calibrated with Visual Cyan Pulse),
# Translucent Crystal Glass Background, and Theme Toggle Icon (ðŸŒ™ Obsidian Night / â˜€ï¸ Crystal Titanium).
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

# Screen bounds in WPF native DIP units
$area = [System.Windows.SystemParameters]::WorkArea
$winW = 450
$winH = 236
$initX = $area.Right - $winW - 14
$initY = $area.Bottom - $winH - 14

# Pure XAML with Crystal Glass styling (CornerRadius 14, compact tight cards, elegant typography)
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
    <Grid Margin="8">
        <!-- Crystal Glass Outer Shell -->
        <Border Name="MainCard" CornerRadius="14" Background="#D1070B14" BorderBrush="#3D5068" BorderThickness="1.2">
            <Border.Effect>
                <DropShadowEffect BlurRadius="18" ShadowDepth="4" Opacity="0.65" Color="#000000" Direction="270"/>
            </Border.Effect>
            <Grid Margin="11,8,11,9">
                <Grid.RowDefinitions>
                    <RowDefinition Height="26"/>
                    <RowDefinition Height="*"/>
                </Grid.RowDefinitions>

                <!-- Integrated Header (Drag Region + Controls) -->
                <Grid Grid.Row="0" Name="HeaderBar" Background="Transparent" Cursor="SizeAll">
                    <Grid.ColumnDefinitions>
                        <ColumnDefinition Width="Auto"/>
                        <ColumnDefinition Width="*"/>
                        <ColumnDefinition Width="Auto"/>
                    </Grid.ColumnDefinitions>

                    <!-- Status Dot & Title -->
                    <StackPanel Grid.Column="0" Orientation="Horizontal" VerticalAlignment="Center">
                        <Ellipse Name="LivePulseDot" Width="7.5" Height="7.5" Fill="#10B981" Margin="2,0,6,0"/>
                        <TextBlock Text="FOREX &amp; ICT STANDBY" Foreground="#E2E8F0" FontSize="10" FontWeight="SemiBold" FontFamily="Segoe UI" VerticalAlignment="Center"/>
                    </StackPanel>

                    <!-- Right Controls (Theme, TZ, Minimize, Close) -->
                    <StackPanel Grid.Column="2" Orientation="Horizontal" VerticalAlignment="Center">
                        <!-- Theme Toggle Button (Moon / Sun) -->
                        <Border Name="BtnTheme" CornerRadius="5" Background="#18FFFFFF" BorderBrush="#26FFFFFF" BorderThickness="1" Width="24" Height="20" Margin="0,0,4,0" Cursor="Hand" ToolTip="Toggle Crystal Day / Obsidian Night Theme">
                            <TextBlock Name="TxtThemeIcon" Text="&#x1F319;" Foreground="#F8FAFC" FontSize="10" HorizontalAlignment="Center" VerticalAlignment="Center"/>
                        </Border>

                        <!-- NY / LOC Toggle Button -->
                        <Border Name="BtnTz" CornerRadius="5" Background="#18FFFFFF" BorderBrush="#26FFFFFF" BorderThickness="1" Padding="6,1.5" Margin="0,0,4,0" Cursor="Hand" ToolTip="Toggle Timezone">
                            <TextBlock Name="TxtTz" Text="LOC &#x21C4; NY" Foreground="#F8FAFC" FontSize="9" FontWeight="SemiBold" FontFamily="Segoe UI"/>
                        </Border>

                        <!-- Minimize Button (-) -->
                        <Border Name="BtnMinimize" CornerRadius="5" Background="#18FFFFFF" BorderBrush="#26FFFFFF" BorderThickness="1" Width="22" Height="20" Margin="0,0,4,0" Cursor="Hand">
                            <TextBlock Text="&#x2212;" Foreground="#F8FAFC" FontSize="11" FontWeight="Bold" HorizontalAlignment="Center" VerticalAlignment="Center" Margin="0,-2,0,0"/>
                        </Border>

                        <!-- Close Button (X) -->
                        <Border Name="BtnClose" CornerRadius="5" Background="#18FFFFFF" BorderBrush="#26FFFFFF" BorderThickness="1" Width="22" Height="20" Cursor="Hand">
                            <TextBlock Text="&#x2715;" Foreground="#F8FAFC" FontSize="9.5" FontWeight="Bold" HorizontalAlignment="Center" VerticalAlignment="Center"/>
                        </Border>
                    </StackPanel>
                </Grid>

                <!-- Main Content: Left Clock Dial + Right Compact Tailored Cards -->
                <Grid Grid.Row="1" Margin="0,6,0,0">
                    <Grid.ColumnDefinitions>
                        <ColumnDefinition Width="144"/>
                        <ColumnDefinition Width="*"/>
                    </Grid.ColumnDefinitions>

                    <!-- LEFT: StandBy Clock with 60-second perimeter ticks -->
                    <Border Name="ClockBorder" Grid.Column="0" CornerRadius="12" Background="#1A0C1320" BorderBrush="#243447" BorderThickness="1" Width="140" Height="140" HorizontalAlignment="Left" VerticalAlignment="Center">
                        <Grid>
                            <!-- Perimeter Ticks Canvas -->
                            <Canvas Name="TicksCanvas" Width="126" Height="126" HorizontalAlignment="Center" VerticalAlignment="Center"/>

                            <!-- Center Clock Readout -->
                            <StackPanel VerticalAlignment="Center" HorizontalAlignment="Center">
                                <!-- AM/PM & Mode Pills -->
                                <StackPanel Orientation="Horizontal" HorizontalAlignment="Center" Margin="0,0,0,2">
                                    <Border CornerRadius="3.5" Background="#22FFFFFF" Padding="4,0.5" Margin="0,0,3,0">
                                        <TextBlock Name="TxtAmpm" Text="AM" Foreground="#E2E8F0" FontSize="8.5" FontWeight="SemiBold" FontFamily="Segoe UI"/>
                                    </Border>
                                    <Border CornerRadius="3.5" Background="#1E6366F1" BorderBrush="#33818CF8" BorderThickness="1" Padding="4,0.5">
                                        <TextBlock Name="TxtZone" Text="LOCAL" Foreground="#A5B4FC" FontSize="8" FontWeight="SemiBold" FontFamily="Segoe UI"/>
                                    </Border>
                                </StackPanel>

                                <!-- Refined Luxury Digital Digits (SemiBold, not fat bold) -->
                                <TextBlock Name="TxtTime" Text="05:36" Foreground="#FFFFFF" FontSize="30" FontWeight="SemiBold" FontFamily="Segoe UI, Segoe UI Variable Display, Consolas" HorizontalAlignment="Center"/>

                                <!-- Real-time Seconds Pill -->
                                <Border CornerRadius="7" Background="#1EFFFFFF" BorderBrush="#2BFFFFFF" BorderThickness="1" Padding="6,1.5" HorizontalAlignment="Center" Margin="0,2,0,0">
                                    <StackPanel Orientation="Horizontal">
                                        <TextBlock Name="TxtSec" Text="27" Foreground="#34D399" FontSize="10" FontWeight="SemiBold" FontFamily="Consolas"/>
                                        <TextBlock Text=" SEC" Foreground="#94A3B8" FontSize="8" FontWeight="SemiBold" VerticalAlignment="Center"/>
                                    </StackPanel>
                                </Border>
                            </StackPanel>
                        </Grid>
                    </Border>

                    <!-- RIGHT: Compact Tailored Cards (No Dead Space) -->
                    <Grid Grid.Column="1" Margin="9,0,0,0">
                        <Grid.RowDefinitions>
                            <RowDefinition Height="*"/>
                            <RowDefinition Height="*"/>
                        </Grid.RowDefinitions>

                        <!-- TOP CARD: Currently Running Session -->
                        <Border Grid.Row="0" Name="CardActive" CornerRadius="9" Background="#21111B29" BorderBrush="#2A3C52" BorderThickness="1" Padding="9,5" Margin="0,0,0,4">
                            <Grid>
                                <Grid.RowDefinitions>
                                    <RowDefinition Height="Auto"/>
                                    <RowDefinition Height="Auto"/>
                                    <RowDefinition Height="*"/>
                                </Grid.RowDefinitions>

                                <Grid Grid.Row="0">
                                    <TextBlock Text="CURRENT SESSION" Foreground="#8595A8" FontSize="8.5" FontWeight="SemiBold" FontFamily="Segoe UI"/>
                                    <Border Name="BadgeActive" CornerRadius="5" Background="#1E10B981" BorderBrush="#3310B981" BorderThickness="1" Padding="6,1" HorizontalAlignment="Right">
                                        <TextBlock Name="TxtActiveBadge" Text="ACTIVE" Foreground="#34D399" FontSize="8" FontWeight="Bold"/>
                                    </Border>
                                </Grid>

                                <Grid Grid.Row="1" Margin="0,2,0,0">
                                    <TextBlock Name="TxtActiveName" Text="London Open" Foreground="#FFFFFF" FontSize="13" FontWeight="SemiBold" FontFamily="Segoe UI"/>
                                    <TextBlock Name="TxtActiveHours" Text="02:00 - 05:00" Foreground="#CBD5E1" FontSize="10.5" FontFamily="Consolas" HorizontalAlignment="Right" VerticalAlignment="Center"/>
                                </Grid>

                                <DockPanel Grid.Row="2" VerticalAlignment="Bottom" Margin="0,2,0,0">
                                    <TextBlock Text="Ends in:" Foreground="#8595A8" FontSize="9.5" VerticalAlignment="Center"/>
                                    <Border CornerRadius="4" Background="#18FFFFFF" BorderBrush="#24FFFFFF" BorderThickness="1" Padding="6,1" HorizontalAlignment="Right">
                                        <TextBlock Name="TxtActiveCountdown" Text="02:14:30" Foreground="#34D399" FontSize="11.5" FontWeight="Bold" FontFamily="Consolas"/>
                                    </Border>
                                </DockPanel>
                            </Grid>
                        </Border>

                        <!-- BOTTOM CARD: Next Upcoming Session -->
                        <Border Grid.Row="1" Name="CardNext" CornerRadius="9" Background="#180E1624" BorderBrush="#203042" BorderThickness="1" Padding="9,5" Margin="0,1,0,0">
                            <Grid>
                                <Grid.RowDefinitions>
                                    <RowDefinition Height="Auto"/>
                                    <RowDefinition Height="Auto"/>
                                    <RowDefinition Height="*"/>
                                </Grid.RowDefinitions>

                                <Grid Grid.Row="0">
                                    <TextBlock Text="NEXT UPCOMING" Foreground="#8595A8" FontSize="8.5" FontWeight="SemiBold" FontFamily="Segoe UI"/>
                                    <Border CornerRadius="5" Background="#1E06B6D4" BorderBrush="#3306B6D4" BorderThickness="1" Padding="6,1" HorizontalAlignment="Right">
                                        <TextBlock Text="UPCOMING" Foreground="#22D3EE" FontSize="8" FontWeight="Bold"/>
                                    </Border>
                                </Grid>

                                <Grid Grid.Row="1" Margin="0,2,0,0">
                                    <TextBlock Name="TxtNextName" Text="New York AM" Foreground="#FFFFFF" FontSize="13" FontWeight="SemiBold" FontFamily="Segoe UI"/>
                                    <TextBlock Name="TxtNextHours" Text="07:00 - 12:00" Foreground="#CBD5E1" FontSize="10.5" FontFamily="Consolas" HorizontalAlignment="Right" VerticalAlignment="Center"/>
                                </Grid>

                                <DockPanel Grid.Row="2" VerticalAlignment="Bottom" Margin="0,2,0,0">
                                    <TextBlock Text="Starts in:" Foreground="#8595A8" FontSize="9.5" VerticalAlignment="Center"/>
                                    <Border CornerRadius="4" Background="#18FFFFFF" BorderBrush="#24FFFFFF" BorderThickness="1" Padding="6,1" HorizontalAlignment="Right">
                                        <TextBlock Name="TxtNextCountdown" Text="04:14:30" Foreground="#22D3EE" FontSize="11.5" FontWeight="Bold" FontFamily="Consolas"/>
                                    </Border>
                                </DockPanel>
                            </Grid>
                        </Border>
                    </Grid>
                </Grid>
            </Grid>
        </Border>
    </Grid>
</Window>
"@

$reader = [System.Xml.XmlReader]::Create([System.IO.StringReader]::new($xaml))
$window = [System.Windows.Markup.XamlReader]::Load($reader)

# Get Named Controls
$mainCard = $window.FindName("MainCard")
$headerBar = $window.FindName("HeaderBar")
$btnTheme = $window.FindName("BtnTheme")
$txtThemeIcon = $window.FindName("TxtThemeIcon")
$btnTz = $window.FindName("BtnTz")
$txtTz = $window.FindName("TxtTz")
$btnMin = $window.FindName("BtnMinimize")
$btnClose = $window.FindName("BtnClose")

$clockBorder = $window.FindName("ClockBorder")
$ticksCanvas = $window.FindName("TicksCanvas")
$txtAmpm = $window.FindName("TxtAmpm")
$txtZone = $window.FindName("TxtZone")
$txtTime = $window.FindName("TxtTime")
$txtSec = $window.FindName("TxtSec")

$liveDot = $window.FindName("LivePulseDot")
$cardActive = $window.FindName("CardActive")
$badgeActive = $window.FindName("BadgeActive")
$txtActiveBadge = $window.FindName("TxtActiveBadge")
$txtActiveName = $window.FindName("TxtActiveName")
$txtActiveHours = $window.FindName("TxtActiveHours")
$txtActiveCountdown = $window.FindName("TxtActiveCountdown")

$cardNext = $window.FindName("CardNext")
$txtNextName = $window.FindName("TxtNextName")
$txtNextHours = $window.FindName("TxtNextHours")
$txtNextCountdown = $window.FindName("TxtNextCountdown")

# Create 60 Precision Line elements on the Canvas
$lineElements = @()
$brushActive = [System.Windows.Media.SolidColorBrush]::new([System.Windows.Media.Color]::FromRgb(255, 255, 255))
$brushInactive = [System.Windows.Media.SolidColorBrush]::new([System.Windows.Media.Color]::FromArgb(40, 255, 255, 255))
$brushCurrent = [System.Windows.Media.SolidColorBrush]::new([System.Windows.Media.Color]::FromRgb(52, 211, 153))

foreach ($t in $script:TicksData) {
    $line = [System.Windows.Shapes.Line]::new()
    $line.X1 = $t.X1; $line.Y1 = $t.Y1
    $line.X2 = $t.X2; $line.Y2 = $t.Y2
    $line.Stroke = $brushInactive
    $line.StrokeThickness = 1.2
    $line.StrokeStartLineCap = [System.Windows.Media.PenLineCap]::Round
    $line.StrokeEndLineCap = [System.Windows.Media.PenLineCap]::Round
    $ticksCanvas.Children.Add($line) | Out-Null
    $lineElements += $line
}

# Theme Toggle Function (Obsidian Night â‡„ Crystal Titanium Day)
function Set-Theme($isDay) {
    $bc = [System.Windows.Media.BrushConverter]::new()
    if ($isDay) {
        # Crystal Titanium Day Mode (Crisp frosted ice crystal)
        $mainCard.Background = $bc.ConvertFromString("#E80E1724")
        $mainCard.BorderBrush = $bc.ConvertFromString("#4F6888")
        $cardActive.Background = $bc.ConvertFromString("#2E1C2B40")
        $cardActive.BorderBrush = $bc.ConvertFromString("#3E5573")
        $cardNext.Background = $bc.ConvertFromString("#22152233")
        $cardNext.BorderBrush = $bc.ConvertFromString("#334760")
        $clockBorder.Background = $bc.ConvertFromString("#26142030")
        $clockBorder.BorderBrush = $bc.ConvertFromString("#3B4F69")
        $txtThemeIcon.Text = [char]0x2600 # Sun icon
    } else {
        # Obsidian Crystal Night Mode (Deep translucent glass)
        $mainCard.Background = $bc.ConvertFromString("#D1070B14")
        $mainCard.BorderBrush = $bc.ConvertFromString("#3D5068")
        $cardActive.Background = $bc.ConvertFromString("#21111B29")
        $cardActive.BorderBrush = $bc.ConvertFromString("#2A3C52")
        $cardNext.Background = $bc.ConvertFromString("#180E1624")
        $cardNext.BorderBrush = $bc.ConvertFromString("#203042")
        $clockBorder.Background = $bc.ConvertFromString("#1A0C1320")
        $clockBorder.BorderBrush = $bc.ConvertFromString("#243447")
        $txtThemeIcon.Text = [char]0x263D # Crescent moon icon
    }
}

# DIP-Calibrated 4-Corner & Edge Magnetic Snapping with Visual Cyan Pulse
function Snap-Window-To-Screen {
    $curLeft = $window.Left
    $curTop = $window.Top
    $w = $window.ActualWidth
    if ($w -le 0) { $w = 450 }
    $h = $window.ActualHeight
    if ($h -le 0) { $h = 236 }

    # Query active monitor bounds in WPF DIP units
    $area = [System.Windows.SystemParameters]::WorkArea
    try {
        $centerX = $curLeft + ($w / 2.0)
        $centerY = $curTop + ($h / 2.0)
        $dpiX = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds.Width / [System.Windows.SystemParameters]::PrimaryScreenWidth
        $dpiY = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds.Height / [System.Windows.SystemParameters]::PrimaryScreenHeight
        if ($dpiX -le 0) { $dpiX = 1.0 }
        if ($dpiY -le 0) { $dpiY = 1.0 }

        $screen = [System.Windows.Forms.Screen]::FromPoint([System.Drawing.Point]::new([int]($centerX * $dpiX), [int]($centerY * $dpiY)))
        $wa = $screen.WorkingArea
        $area = [PSCustomObject]@{
            Left   = $wa.Left / $dpiX
            Top    = $wa.Top / $dpiY
            Right  = $wa.Right / $dpiX
            Bottom = $wa.Bottom / $dpiY
        }
    } catch {}

    $snapThreshold = 85 # 85px magnetic attraction range
    $margin = 12        # 12px margin from screen edges
    $didSnap = $false

    $targetLeft = $curLeft
    $targetTop = $curTop

    # Left snap (Left edge or Left corners)
    if ([Math]::Abs($curLeft - ($area.Left + $margin)) -lt $snapThreshold -or $curLeft -lt ($area.Left + $snapThreshold)) {
        $targetLeft = $area.Left + $margin
        $didSnap = $true
    }
    # Right snap (Right edge or Right corners)
    elseif ([Math]::Abs(($curLeft + $w) - ($area.Right - $margin)) -lt $snapThreshold -or ($curLeft + $w) -gt ($area.Right - $snapThreshold)) {
        $targetLeft = $area.Right - $w - $margin
        $didSnap = $true
    }

    # Top snap (Top edge or Top corners)
    if ([Math]::Abs($curTop - ($area.Top + $margin)) -lt $snapThreshold -or $curTop -lt ($area.Top + $snapThreshold)) {
        $targetTop = $area.Top + $margin
        $didSnap = $true
    }
    # Bottom snap (Bottom edge or Bottom corners)
    elseif ([Math]::Abs(($curTop + $h) - ($area.Bottom - $margin)) -lt $snapThreshold -or ($curTop + $h) -gt ($area.Bottom - $snapThreshold)) {
        $targetTop = $area.Bottom - $h - $margin
        $didSnap = $true
    }

    $window.Left = $targetLeft
    $window.Top = $targetTop

    # Visual cyan snap confirmation pulse
    if ($didSnap -and $mainCard -ne $null) {
        $origBorder = $mainCard.BorderBrush
        $mainCard.BorderBrush = [System.Windows.Media.SolidColorBrush]::new([System.Windows.Media.Color]::FromRgb(56, 189, 248))
        $pulseTimer = New-Object System.Windows.Threading.DispatcherTimer
        $pulseTimer.Interval = [TimeSpan]::FromMilliseconds(300)
        $pulseTimer.Add_Tick({
            $mainCard.BorderBrush = $origBorder
            $pulseTimer.Stop()
        })
        $pulseTimer.Start()
    }
}

# Dragging Support with Magnetic Corner Snap
$headerBar.Add_MouseLeftButtonDown({
    param($s, $e)
    try {
        $window.DragMove()
        Snap-Window-To-Screen
    } catch {}
})
$mainCard.Add_MouseLeftButtonDown({
    param($s, $e)
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

# Button Hover Effects
$btnTheme.Add_MouseEnter({ $btnTheme.Background = [System.Windows.Media.SolidColorBrush]::new([System.Windows.Media.Color]::FromArgb(60, 255, 255, 255)) })
$btnTheme.Add_MouseLeave({ $btnTheme.Background = [System.Windows.Media.SolidColorBrush]::new([System.Windows.Media.Color]::FromArgb(24, 255, 255, 255)) })

$btnMin.Add_MouseEnter({ $btnMin.Background = [System.Windows.Media.SolidColorBrush]::new([System.Windows.Media.Color]::FromArgb(60, 255, 255, 255)) })
$btnMin.Add_MouseLeave({ $btnMin.Background = [System.Windows.Media.SolidColorBrush]::new([System.Windows.Media.Color]::FromArgb(24, 255, 255, 255)) })

$btnClose.Add_MouseEnter({ $btnClose.Background = [System.Windows.Media.SolidColorBrush]::new([System.Windows.Media.Color]::FromRgb(225, 29, 72)) })
$btnClose.Add_MouseLeave({ $btnClose.Background = [System.Windows.Media.SolidColorBrush]::new([System.Windows.Media.Color]::FromArgb(24, 255, 255, 255)) })

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
            $line.Stroke = $brushCurrent
            $line.StrokeThickness = 2.4
        } elseif ($i -lt $sec) {
            $line.Stroke = $brushActive
            $line.StrokeThickness = 1.8
        } else {
            $line.Stroke = $brushInactive
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
    } elseif ($totalSec -ge (& $toSec 2 0) -and $totalSec -lt (& $toSec 5 0)) {
        $activeName = "London Open"
        $isLive = $true
        $activeEndsIn = (& $toSec 5 0) - $totalSec
        $hStart1 = 2; $hEnd1 = 5
        if ($totalSec -ge (& $toSec 3 0) -and $totalSec -lt (& $toSec 4 0)) {
            $isSb = $true; $bulletName = "London Silver Bullet"
        }
        $nextName = "New York AM"
        $nextStartsIn = (& $toSec 7 0) - $totalSec
        $hStart2 = 7; $hEnd2 = 12
    } elseif ($totalSec -ge (& $toSec 5 0) -and $totalSec -lt (& $toSec 7 0)) {
        $activeName = "Off-Hours (Pre-NY)"
        $activeEndsIn = (& $toSec 7 0) - $totalSec
        $nextName = "New York AM"
        $nextStartsIn = (& $toSec 7 0) - $totalSec
        $hStart2 = 7; $hEnd2 = 12
    } elseif ($totalSec -ge (& $toSec 7 0) -and $totalSec -lt (& $toSec 12 0)) {
        $activeName = "New York AM"
        $isLive = $true
        $activeEndsIn = (& $toSec 12 0) - $totalSec
        $hStart1 = 7; $hEnd1 = 12
        if ($totalSec -ge (& $toSec 10 0) -and $totalSec -lt (& $toSec 11 0)) {
            $isSb = $true; $bulletName = "NY AM Silver Bullet"
        }
        $nextName = "New York PM"
        $nextStartsIn = (& $toSec 13 0) - $totalSec
        $hStart2 = 13; $hEnd2 = 16
    } elseif ($totalSec -ge (& $toSec 12 0) -and $totalSec -lt (& $toSec 13 0)) {
        $activeName = "Off-Hours (Lunch)"
        $activeEndsIn = (& $toSec 13 0) - $totalSec
        $nextName = "New York PM"
        $nextStartsIn = (& $toSec 13 0) - $totalSec
        $hStart2 = 13; $hEnd2 = 16
    } elseif ($totalSec -ge (& $toSec 13 0) -and $totalSec -lt (& $toSec 16 0)) {
        $activeName = "New York PM"
        $isLive = $true
        $activeEndsIn = (& $toSec 16 0) - $totalSec
        $hStart1 = 13; $hEnd1 = 16
        if ($totalSec -ge (& $toSec 14 0) -and $totalSec -lt (& $toSec 15 0)) {
            $isSb = $true; $bulletName = "NY PM Silver Bullet"
        }
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
        if ($totalSec -ge (& $toSec 20 0) -and $totalSec -lt (& $toSec 21 0)) {
            $isSb = $true; $bulletName = "Asian Silver Bullet"
        }
        $nextName = "London Open"
        $nextStartsIn = ((& $toSec 24 0) - $totalSec) + (& $toSec 2 0)
        $hStart2 = 2; $hEnd2 = 5
    }

    # Update Active Card UI
    if ($isSb) {
        $txtActiveName.Text = $bulletName
        $txtActiveBadge.Text = "SILVER BULLET"
        $txtActiveBadge.Foreground = [System.Windows.Media.SolidColorBrush]::new([System.Windows.Media.Color]::FromRgb(251, 191, 36))
        $badgeActive.BorderBrush = [System.Windows.Media.SolidColorBrush]::new([System.Windows.Media.Color]::FromArgb(100, 251, 191, 36))
        $badgeActive.Background = [System.Windows.Media.SolidColorBrush]::new([System.Windows.Media.Color]::FromArgb(40, 251, 191, 36))
        $txtActiveCountdown.Foreground = [System.Windows.Media.SolidColorBrush]::new([System.Windows.Media.Color]::FromRgb(251, 191, 36))
    } elseif ($isLive) {
        $txtActiveName.Text = $activeName
        $txtActiveBadge.Text = "ACTIVE"
        $txtActiveBadge.Foreground = [System.Windows.Media.SolidColorBrush]::new([System.Windows.Media.Color]::FromRgb(52, 211, 153))
        $badgeActive.BorderBrush = [System.Windows.Media.SolidColorBrush]::new([System.Windows.Media.Color]::FromArgb(100, 52, 211, 153))
        $badgeActive.Background = [System.Windows.Media.SolidColorBrush]::new([System.Windows.Media.Color]::FromArgb(40, 52, 211, 153))
        $txtActiveCountdown.Foreground = [System.Windows.Media.SolidColorBrush]::new([System.Windows.Media.Color]::FromRgb(52, 211, 153))
    } else {
        $txtActiveName.Text = $activeName
        $txtActiveBadge.Text = "OFF-HOURS"
        $txtActiveBadge.Foreground = [System.Windows.Media.SolidColorBrush]::new([System.Windows.Media.Color]::FromRgb(148, 163, 184))
        $badgeActive.BorderBrush = [System.Windows.Media.SolidColorBrush]::new([System.Windows.Media.Color]::FromArgb(50, 255, 255, 255))
        $badgeActive.Background = [System.Windows.Media.SolidColorBrush]::new([System.Windows.Media.Color]::FromArgb(20, 255, 255, 255))
        $txtActiveCountdown.Foreground = [System.Windows.Media.SolidColorBrush]::new([System.Windows.Media.Color]::FromRgb(226, 232, 240))
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
})

$window.Add_Closed({
    Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
})

$dispatcherTimer.Start()
$window.ShowDialog() | Out-Null
