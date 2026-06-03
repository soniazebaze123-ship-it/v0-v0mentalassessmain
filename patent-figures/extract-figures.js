const fs = require("fs")

const sourcePath = "PATENT_FIGURES.md"
const source = fs.readFileSync(sourcePath, "utf8")
const sections = source.split("## FIG. ").slice(1)

if (!fs.existsSync("patent-figures/src")) {
  fs.mkdirSync("patent-figures/src", { recursive: true })
}
if (!fs.existsSync("patent-figures/svg")) {
  fs.mkdirSync("patent-figures/svg", { recursive: true })
}
if (!fs.existsSync("patent-figures/png")) {
  fs.mkdirSync("patent-figures/png", { recursive: true })
}

const manifest = []

for (const section of sections) {
  const firstLineEnd = section.indexOf("\n")
  if (firstLineEnd < 0) continue

  const header = section.slice(0, firstLineEnd).trim()
  const match = header.match(/^(\d+)\s*:\s*(.+)$/)
  if (!match) continue

  const number = String(Number(match[1])).padStart(2, "0")
  const title = match[2].trim()

  const fenceStart = section.indexOf("```mermaid")
  if (fenceStart < 0) continue
  const bodyStart = section.indexOf("\n", fenceStart) + 1
  const fenceEnd = section.indexOf("```", bodyStart)
  if (fenceEnd < 0) continue

  const diagram = section.slice(bodyStart, fenceEnd).trim() + "\n"
  const mmdPath = `patent-figures/src/fig-${number}.mmd`
  const svgPath = `patent-figures/svg/fig-${number}.svg`
  const pngPath = `patent-figures/png/fig-${number}.png`

  fs.writeFileSync(mmdPath, diagram)
  manifest.push({
    figure: `FIG. ${Number(match[1])}`,
    number,
    title,
    mmdPath,
    svgPath,
    pngPath,
  })
}

fs.writeFileSync("patent-figures/figures-manifest.json", JSON.stringify(manifest, null, 2))
console.log(`Extracted ${manifest.length} figures`)
