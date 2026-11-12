$html = [System.IO.File]::ReadAllText('D:\DIGITAX\demo\v1\index.html')
$scene = [System.IO.File]::ReadAllText('D:\DIGITAX\demo\v1\scene2.html')
$marker = '  </div>' + [Environment]::NewLine + '</div>' + [Environment]::NewLine + '<div id="ripple"></div>'
$idx = $html.IndexOf($marker)
if ($idx -ge 0) {
    $html = $html.Substring(0, $idx) + $scene + $html.Substring($idx)
    [System.IO.File]::WriteAllText('D:\DIGITAX\demo\v1\index.html', $html, [System.Text.UTF8Encoding]::new($false))
    Write-Host "Scene 2 inserted at index $idx"
} else {
    Write-Host "Marker not found"
}