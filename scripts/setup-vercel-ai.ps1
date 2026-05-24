# Adds GEMINI_API_KEY and GROQ_API_KEY from .env.local to Vercel.
# Run from repo root after: npx vercel login && npx vercel link

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$envFile = Join-Path $root ".env.local"

if (-not (Test-Path $envFile)) {
  Write-Error ".env.local not found. Copy .env.example and add your keys first."
}

function Get-EnvValue([string]$name) {
  $line = Get-Content $envFile | Where-Object { $_ -match "^\s*$name=" } | Select-Object -First 1
  if (-not $line) { return $null }
  return ($line -split "=", 2)[1].Trim()
}

$keys = @("GEMINI_API_KEY", "GROQ_API_KEY")
$envs = @("production", "preview", "development")

foreach ($key in $keys) {
  $value = Get-EnvValue $key
  if (-not $value -or $value -match "your-.*-key-here") {
    Write-Warning "Skipping $key - not set in .env.local"
    continue
  }

  foreach ($env in $envs) {
    Write-Host "Adding $key to $env..."
    $value | npx vercel env add $key $env --force
  }
}

Write-Host "Done. Redeploy from Vercel dashboard or run: npx vercel --prod"
