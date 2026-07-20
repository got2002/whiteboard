Add-Type -AssemblyName System.Drawing
$original = [System.Drawing.Image]::FromFile('C:\Users\thaih\Downloads\ChatGPT Image Jul 20, 2026, 11_32_57 AM - Copy.png')
$bmp = New-Object System.Drawing.Bitmap(256, 256)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.Clear([System.Drawing.Color]::Transparent)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

# Calculate keeping aspect ratio
$ratioX = 256.0 / $original.Width
$ratioY = 256.0 / $original.Height
$ratio = [Math]::Min($ratioX, $ratioY)
$newWidth = [int]($original.Width * $ratio)
$newHeight = [int]($original.Height * $ratio)
$posX = [int]((256 - $newWidth) / 2)
$posY = [int]((256 - $newHeight) / 2)

$g.DrawImage($original, $posX, $posY, $newWidth, $newHeight)
$bmp.Save('C:\Users\thaih\OneDrive\เอกสาร\GitHub\whiteboard\build\app_icon.png', [System.Drawing.Imaging.ImageFormat]::Png)

$g.Dispose()
$bmp.Dispose()
$original.Dispose()
Write-Host 'Image processed successfully.'
