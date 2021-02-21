import 'gun/gun'
import 'gun/sea.js'
import $, {
  view, record, typeEl, loopTypes,
  VIDEO_TYPES, MIME_TYPES
} from './utils'

let ns
let appNamespace

const vid = $('#video')
const broadcast = $('#broadcast')
const logout = $('#logout')
const recBtns = $('.record')
const authenticate = $('#authenticate > form')
const namespace = $('#namespace > form')

// const localPeer = `${location.protocol}//${location.hostname}:8765/gun`
const localPeer = `${location.href}gun`
const remotePeers = [
  // 'https://gunmeetingserver.herokuapp.com/gun',
  'https://gun-matrix.herokuapp.com/gun',
  'https://gun-us.herokuapp.com/gun',
]
const peers = [
  ...remotePeers,
  // localPeer,
]
const gun = Gun({ peers, localStorage: true, radisk: false })
const gunUser = gun.user()

const changeUserState = () => {
  if (gunUser.is) {
    broadcast.style = 'display:block;'
    authenticate.style = 'display:none;'
    namespace.style = 'display:none;'
  } else {
    broadcast.style = 'display:none;'
    authenticate.style = 'display:block;'
    namespace.style = 'display:block;'
  }
}

changeUserState()

const bb = window.bb = {
  sb: null,
  ms: null
}

const createUser = (username, pass) => new Promise(res => gunUser.create(username, pass, res))
const authedUser = (username, pass) => new Promise(res => gunUser.auth(username, pass, res))

gun.on('auth', (...a) => {
  changeUserState()
})

gunUser.recall({ sessionStorage: true })

logout.on('click', e => {
  // console.log('logout', out)
  record?.ing?.stop()
  gunUser.leave()
  changeUserState()
})

authenticate.on('submit', async e => {
  e.preventDefault()

  const user = $('#user').value
  const pass = $('#pass').value

  const au = await authedUser(user, pass)
  // console.log('auth user', au)

  if (au.err) {
    const cu = await createUser(user, pass)
    const au = await authedUser(user, pass)
    // console.log('create user', cu, au)
  }
})

namespace.on('submit', e => {
  e.preventDefault()
  appNamespace = namespace.elements?.pubkey?.value

  console.log('namespace', appNamespace)

  if (appNamespace.indexOf('@') === 0) {
    gun.get(`~${appNamespace}`).map().once((_, key) => {
      appNamespace = key.substring(1)
      ns = gun.user(appNamespace)
      view({ vid, ns, bb })
      console.log('namespace alias', e, appNamespace, ns)
    })
  } else {
    ns = gun.user(appNamespace)
    view({ vid, ns, bb })
    console.log('namespace pub key', e, appNamespace, ns)
  }
})

recBtns.forEach(btn => {
  btn.onclick = el => {
    if (!gunUser?.is) {
      console.log('wrong', gunUser?.is)
      return
    }

    if (record.ing) {
      el.target.textContent = record.type

      record?.ing?.stop()
    } else {
      record({ vid, ns: gunUser, type: btn.textContent })
      btn.textContent = "End"
    }
  }
})

// https://developer.mozilla.org/en-US/docs/Web/Media/Formats/codecs_parameter
const supportedTypes = $('#supportedTypes')

const sup = ['p', supportedTypes, MediaSource, 'isTypeSupported']
const cpt = ['p', supportedTypes, vid, 'canPlayType']

loopTypes(VIDEO_TYPES, vt => typeEl(...sup, vt))

supportedTypes.appendChild(document.createElement("br"))

loopTypes(MIME_TYPES, mt => typeEl(...sup, mt))

supportedTypes.appendChild(document.createElement("br"))

loopTypes(MIME_TYPES, mt => typeEl(...cpt, mt))

window.gun = gun
window.HELP_IMPROVE_VIDEOJS = false
