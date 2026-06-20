Set-Location $PSScriptRoot
if ($env:PYTHON) {
  $py = $env:PYTHON
} else {
  $py = "python"
}
& $py -m pip install -r requirements.txt
& $py main.py
