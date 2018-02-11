import * as fs from 'fs'
import * as process from 'process'
import * as yaml from 'js-yaml'
import * as proc from 'child_process'

const scheme_file = process.argv[2]
const alpha = process.argv[3] || '100'

if (!scheme_file) {
  throw 'Need one argument: the scheme'
}

const scheme: Record<string, string> = yaml.load(fs.readFileSync(scheme_file, 'utf8'))

function hex(s: string) {
  const c = scheme[s]
  if (!c || !c.match(/^[0-9A-Fa-f]{6}$/)) {
    throw s + ' not mapped to a valid colour: ' + c
  }
  return '#' + c
}

const base00: string = hex('base00')
const base01: string = hex('base01')
const base02: string = hex('base02')
const base03: string = hex('base03')
const base04: string = hex('base04')
const base05: string = hex('base05')
const base06: string = hex('base06')
const base07: string = hex('base07')
const base08: string = hex('base08')
const base09: string = hex('base09')
const base0A: string = hex('base0A')
const base0B: string = hex('base0B')
const base0C: string = hex('base0C')
const base0D: string = hex('base0D')
const base0E: string = hex('base0E')
const base0F: string = hex('base0F')

const escape_sequences = {
  foreground: (hex: string) => `\u001b]10;${hex}\u0007`,
  background: (alpha: string, hex: string) => `\u001b]11;[${alpha}]${hex}\u0007`,
  cursorColor: (hex: string) => `\u001b]12;${hex}\u0007`,
  borderColor: (hex: string) => `\u001b]708;${hex}\u0007`,
  color: (i: number, hex: string) => `\u001b]4;${i};${hex}\u0007`,
}

type UrxvtAPI = typeof escape_sequences

const xresources: UrxvtAPI = {
  foreground: (hex: string) => `*foreground: ${hex}`,
  background: (alpha: string, hex: string) => `*background: [${alpha}]${hex}`,
  cursorColor: (hex: string) => `*cursorColor: ${hex}`,
  borderColor: (hex: string) => `*borderColor: ${hex}`,
  color: (i: number, hex: string) => `*color${i}: ${hex}`,
}

function urxvt(api: UrxvtAPI): string[] {
  const out: string[] = []
  const h = out.push.bind(out)
  h(api.foreground(base05))
  h(api.background(alpha, base00))
  h(api.cursorColor(base05))
  h(api.borderColor(base00))

  h(api.color(0, base00))
  h(api.color(1, base08))
  h(api.color(2, base0B))
  h(api.color(3, base0A))
  h(api.color(4, base0D))
  h(api.color(5, base0E))
  h(api.color(6, base0C))
  h(api.color(7, base05))

  h(api.color(8, base03))
  h(api.color(9, base09))
  h(api.color(10, base01))
  h(api.color(11, base02))
  h(api.color(12, base04))
  h(api.color(13, base06))
  h(api.color(14, base0F))
  h(api.color(15, base07))
  return out
}

function exec(cmd: string, stdin: string = '') {
  const [command, ...args] = cmd.split(' ')
  const res = proc.spawnSync(command, args, {encoding: 'utf8', input: stdin})
  if (res.stdout || res.stderr) {
    console.error(res)
  }
}

const escapes = urxvt(escape_sequences).join('')

// update current terminal
process.stdout.write(escapes)

// update the colour scheme on all running terminals:
const ptspath = '/dev/pts'
const ptss = fs.readdirSync(ptspath).map(pt => ptspath + '/' + pt)
ptss.forEach(pt => {
  fs.open(pt, 'w', undefined, (err, fd) => {
    if (err) {
      console.error(pt, err)
    } else {
      fs.writeSync(fd, escapes, null, 'utf8')
    }
  })
})

// update XResources for new terminals
exec('xrdb -merge', urxvt(xresources).join('\n'))

// set borders in bspwm
exec(`bspc config focused_border_color ${base0B}`)
exec(`bspc config presel_feedback_color ${base0A}`)
// exec(`bspc config normal_border_color ${base01}`)
exec(`bspc config normal_border_color #333333`)
