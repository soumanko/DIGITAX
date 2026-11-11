$parts = @(
    'D:\DIGITAX\demo\v1\append_part1.html',
    'D:\DIGITAX\demo\v1\append_part2.html',
    'D:\DIGITAX\demo\v1\append_part3.html',
    'D:\DIGITAX\demo\v1\append_part4.html'
)
$html = [System.IO.File]::ReadAllText('D:\DIGITAX\demo\v1\index.html')
foreach ($part in $parts) {
    $content = [System.IO.File]::ReadAllText($part)
    $html += $content
}
[System.IO.File]::WriteAllText('D:\DIGITAX\demo\v1\index.html', $html, [System.Text.UTF8Encoding]::new($false))
Write-Host "All parts appended successfully"