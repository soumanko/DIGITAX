$html = [System.IO.File]::ReadAllText('D:\DIGITAX\demo\v1\index.html')
$scene = [System.IO.File]::ReadAllText('D:\DIGITAX\demo\v1\scene01.html')
$marker = '  <div id="viewport">'
$idx = $html.IndexOf($marker)
if ($idx -ge 0) {
    $html = $html.Substring(0, $idx + $marker.Length) + "`n" + $scene + $html.Substring($idx + $marker.Length)
    [System.IO.File]::WriteAllText('D:\DIGITAX\demo\v1\index.html', $html, [System.Text.UTF8Encoding]::new($false))
    Write-Host "Scene 01 inserted at index $idx"
} else {
    Write-Host "Marker not found"
}