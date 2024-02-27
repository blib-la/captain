param(
    [string]$v = "3.10.9",
    [string]$r = ".\requirements.txt",
    [string]$d = ".\python-embedded",
    [string]$c,
    [string]$a
)

$pythonVersion = $v
$requirementsPath = $r
$captainVersion = $c
$zipPath = "python_embedded-$v.zip"
$pythonEmbeddedPath = $d

# Download python
if (-Not (Test-Path $zipPath)) {
    Invoke-WebRequest -Uri "https://www.python.org/ftp/python/$pythonVersion/python-$pythonVersion-embed-amd64.zip" -OutFile $zipPath
    Expand-Archive -Path $zipPath -DestinationPath $pythonEmbeddedPath
}

Write-Output $zipPath

# Create destination folder
if (-Not (Test-Path $pythonEmbeddedPath)) {
    Expand-Archive -Path $zipPath -DestinationPath $pythonEmbeddedPath
}

# Set python
$pythonExePath = Join-Path -Path $pythonEmbeddedPath -ChildPath "python.exe"

# Get pip
$pipPath = Join-Path -Path $pythonEmbeddedPath -ChildPath "get-pip.py"
if (-Not (Test-Path $pipPath)) {
    Invoke-WebRequest -Uri "https://bootstrap.pypa.io/get-pip.py" -OutFile $pipPath
}

# Install pip
& $pythonExePath $pipPath

# Find the _pth file and read its content
$pthFile = Get-ChildItem -Path $pythonEmbeddedPath -Filter "python*._pth"
$contentLines = Get-Content $pthFile.FullName

# Initialize an empty list to hold the new content, excluding 'import site' lines
$newContent = @()

foreach ($line in $contentLines) {
    if (-not ($line -match '^\s*#?import site\s*$')) {
        $newContent += $line
    }
}

$newContent += 'import site'

if ($a -and -not ($newContent -contains $a)) {
    $newContent += $a
}

$newContent | Set-Content $pthFile.FullName

# Install requirements from requirements.txt
if (Test-Path $requirementsPath) {
    $requirementsDir = Split-Path -Parent $requirementsPath

    Push-Location $requirementsDir

    & $pythonExePath -m pip install -r (Get-Item $requirementsPath).Name

    Pop-Location

    # Check if pip install was successful
    if ($LASTEXITCODE -eq 0) {
        $flagFilePath = Join-Path -Path $pythonEmbeddedPath -ChildPath "installation_successful.flag"
        $flagContent = $captainVersion
        $flagContent | Out-File $flagFilePath -Encoding UTF8
        Write-Host "Installation successful. Flag file created at $flagFilePath"
    } else {
        Write-Host "Installation failed. Check the error messages above."
    }
} else {
    Write-Host "requirements.txt not found at $requirementsPath"
}
