let allClusterHex = ''
let initSegment = ''

export const RECORD_INTERVAL = 1000

export const T_MP4 = 'video/mp4'
export const T_WEBM = 'video/webm'
export const T_QT = 'video/quicktime'
export const T_MPEG = 'video/mpeg'
export const T_OGG = 'video/ogg'

export const VIDEO_TYPES = [
  T_WEBM,
  T_MP4,
  T_QT,
  T_MPEG,
  T_OGG
]

export const C_AVC1_E = `avc1.42E01E,mp4a.40.2`
export const C_AVC1_A = `avc1.4d002a`
export const C_OPUS_VP8 = `opus,vp8`
export const C_VORB_VP8 = `vorbis,vp8`
export const C_OPUS_VP9 = `opus,vp9`
export const C_VORB_VP9 = `vorbis,vp9`
export const C_VORB_THEO = `vorbis,theora`
export const C_H264 = `h264`
export const C_DAALA = `daala`

export const CODEC_TYPES = [
  C_OPUS_VP8,
  C_VORB_VP8,
  C_AVC1_A,
  C_AVC1_E,
  C_VORB_THEO,
  C_H264,
  C_DAALA,
  C_OPUS_VP9,
  C_VORB_VP9,
]

export const metaCodec = (V, C) => `${V}; codecs="${C}"`

export const MIME_TYPES = loopAllTypes()

export function loopAllTypes() {
  const MTS = []
  for(let VT of VIDEO_TYPES) {
    for(let CT of CODEC_TYPES) {
      MTS.push(metaCodec(VT, CT))
    }
  }
  return MTS
}

export function loopTypes(t, fn) {
  for(let MT of t) {
    fn(MT)
  }
}

export function typeEl(type, parent, targ, fn, codec) {
  let el = document.createElement(type)
  const res = targ[fn](codec)
  el.textContent = `${fn} = ${codec} : ${res}`
  if (!res) {
    el.style = 'opacity:.3;'
  }
  parent.appendChild(el)
}

export function getSupportedMimeTypes() {
  const MTS = []
  if ('MediaSource' in window) {
    for(let VT of VIDEO_TYPES) {
      for(let CT of CODEC_TYPES) {
        const MT = metaCodec(VT, CT)
        if (MediaSource.isTypeSupported(MT)) {
          MTS.push(MT)
        }
      }
    }
    return MTS
  }
  return false
}

export function getSupportedMimeType() {
  if ('MediaSource' in window) {
    for(let MT of getSupportedMimeTypes()) {
      if (MediaSource.isTypeSupported(MT)) {
        return MT
      }
    }
  }
  return false
}

export function setSrc(vid, val) {
  if ('srcObject' in vid) {
    try {
      vid.srcObject = val;
    } catch (err) {
      if (err.name != "TypeError") {
        throw err;
      }
      vid.src = URL.createObjectURL(val);
    }
  } else {
    vid.src = URL.createObjectURL(val);
  }
}

export const MIME_TYPE = getSupportedMimeType()
export const SUP_MIME_TYPES = getSupportedMimeTypes()
console.log('SELECTED MIME TYPE', MIME_TYPE)
console.log('SUPPORTED MIME TYPE', SUP_MIME_TYPES)

// From shaka-player. Apache License 2.0
// https://github.com/google/shaka-player/blob/master/lib/polyfill/mediasource.js
function safariVersion() {
    if (!navigator.vendor?.includes('Apple')) {
      return null;
    }

    // This works for iOS Safari and desktop Safari, which contain something
    // like "Version/13.0" indicating the major Safari or iOS version.
    let match = navigator.userAgent.match(/Version\/(\d+)/);
    if (match) {
      return parseInt(match[1], 10);
    }

    // This works for all other browsers on iOS, which contain something like
    // "OS 13_3" indicating the major & minor iOS version.
    match = navigator.userAgent.match(/OS (\d+)(?:_\d+)?/);
    if (match) {
      return parseInt(match[1], 10);
    }

    return null;
}

export function stubAbort() {
  const addSourceBuffer = MediaSource.prototype.addSourceBuffer

  MediaSource.prototype.addSourceBuffer = function(...varArgs) {
    const sourceBuffer = addSourceBuffer.apply(this, varArgs)
    sourceBuffer.abort = function() {} // Stub out for buggy implementations.
    return sourceBuffer
  };
}

export function patchRemovalRange() {
  const originalRemove = SourceBuffer.prototype.remove

  SourceBuffer.prototype.remove = function(startTime, endTime) {
    return originalRemove.call(this, startTime, endTime - 0.001)
  }
}

export function addSB(vid, bb, cb) {
  if (vid && (!bb.ms || !bb.sb) && MIME_TYPE) {
    if (safariVersion) {
      stubAbort()
      if (safariVersion <= 12) {
        // Safari 11 & 12 do not correctly implement abort() on SourceBuffer.
        // Calling abort() before appending a segment causes that segment to be
        // incomplete in the buffer.
        // Bug filed: https://bugs.webkit.org/show_bug.cgi?id=165342

        // If you remove up to a keyframe, Safari 11 & 12 incorrectly will also
        // remove that keyframe and the content up to the next.
        // Offsetting the end of the removal range seems to help.
        // Bug filed: https://bugs.webkit.org/show_bug.cgi?id=177884
        patchRemovalRange()
      }
    }

    bb.ms = new MediaSource

    setSrc(vid, bb.ms)

    bb.ms.addEventListener('sourceopen', event => {
      vid.autoplay = true
      vid.controls = true
      bb.sb = event.target.addSourceBuffer(MIME_TYPE)
      bb.sb.mode = 'sequence'
      cb(bb)
    })
  }
  return bb
}

function hex2buf(hex) {
  return new Uint8Array(
    (hex.match(/[\da-f]{2}/gi) || [])
    .map(function (h) {
      return parseInt(h, 16)
    })
  ).buffer
}

function buf2hex(buffer) {
  return Array.prototype.map.call(
    new Uint8Array(buffer),
    x => ('00' + x.toString(16)).slice(-2)
  ).join('')
}

export function parseSelf(arrayBuffer, cb = postMessage) {
  const hex = buf2hex(arrayBuffer)

  const ebmlIndex = hex.indexOf("1a45dfa3")
  const clusterIndex = hex.indexOf("1f43b675")
  const trackIndex = hex.indexOf("1654ae6b")
  const cuesIndex = hex.indexOf("1c53bb6b")
  const segmentIndex = hex.indexOf("18538067")
  const infoIndex = hex.indexOf("1549a966")
  const seekIndex = hex.indexOf("114d9b74")

  if (
    ebmlIndex == -1 && clusterIndex == -1 &&
    trackIndex == -1 && cuesIndex == -1 &&
    segmentIndex == -1 && infoIndex == -1 &&
    seekIndex == -1
  ) {
    allClusterHex += hex
  }

  if (ebmlIndex > -1) {
    initSegment = clusterIndex > -1 ?
      hex.substring(ebmlIndex, clusterIndex) :
      hex.substring(ebmlIndex)

    const initArray = new Uint8Array(hex2buf(initSegment))

    cb(btoa(
      new Uint8Array(initArray)
        .reduce((onData, byte) => onData + String.fromCharCode(byte), '')
    ))
  }

  if (clusterIndex > -1) {
    if (allClusterHex.length != 0) {
      allClusterHex += hex.substring(0, clusterIndex)

      const clusters = new Uint8Array(hex2buf(allClusterHex))

      cb(btoa(clusters.reduce(
        (onData, byte) => onData + String.fromCharCode(byte), ''
      )))

      allClusterHex = ""
    }
    const cluster = hex.substring(clusterIndex, hex.length)
    allClusterHex += cluster
  }
}

export function str2ab(str) {
  let strLen = str.length
  let buf = new ArrayBuffer(strLen)
  let bufView = new Uint8Array(buf)
  for (let i = 0; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i)
  }
  return buf
}

export function appendBuffer(data, sb) {
  if (data && sb) {
    let byteCharacters = atob(data)
    let byteArray = str2ab(byteCharacters)

    if (!sb.updating) {
      sb.appendBuffer(byteArray)
      // $('center').style = 'display:none;'
    }
  }
}

export function view({ vid, ns, bb }) {
  ns.get('stream/video').on(function(stream) {
    addSB(vid, bb, b2 => {
      bb.ms = b2.ms
      bb.sb = b2.sb

      if (bb.ms.readyState == 'open') {
        bb.sb.abort()
      }
    })

    if (stream) {
      if (vid.readyState != 0) {
        appendBuffer(stream.data, bb.sb)
      } else {
        appendBuffer(stream.initial, bb.sb)
        vid.muted = false
        vid.play()
      }
    } else {
      vid.controls = false
      vid.pause()
      vid.src = null
    }
  })
}

export function record({ vid, ns, type }) {
  let initial
  let stopping = false
  let ended = false

  record.type = type

  if('Camera' === type) {
    navigator.mediaDevices.getUserMedia({
      audio: true,
      video: {
        width: { min: 1024, ideal: 1920 },
        height: { min: 576, ideal: 1080 },
        facingMode: 'environment',
        frameRate: 24,
      },
    })
    .then(load).catch(console.error)
  }

  if('Screen' === type) {
    navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
      .then(desktopStream => {
        navigator.mediaDevices.getUserMedia({ video: false, audio: true })
          .then(voiceStream => {
            let tracks = [desktopStream.getVideoTracks()[0], voiceStream.getAudioTracks()[0]]
            return new MediaStream(tracks)
          })
          .then(load).catch(console.error)
      })
  }

  function load(media) {
    ended = false
    ns.get('stream/video').off().put(null)
    vid.srcObject = media
    vid.play()

    record.ing = new MediaRecorder(
      media,
      { mimeType: MIME_TYPE }
    )

    record.ing.onstop = () => {
      stopping = true
      vid.pause()
      vid.srcObject = null
      record.ing = false
    }

    record.ing.ondataavailable = onDataAvailable

    record.ing.start(RECORD_INTERVAL)
  }

  function onDataAvailable(event) {
    if (event.data.size > 0) {
      event.data.arrayBuffer().then(ab => {
        parseSelf(new Uint8Array(ab), async data => {
          let timestamp = new Date().getTime()

          if (!ended) {
            if (initial === undefined && data?.startsWith('GkXf')) {
              initial = data
              ns.get('stream/video').put({ initial, data, timestamp })
            } else {
              ns.get('stream/video').put({ data, timestamp })
            }
          }

          if (stopping) {
            stopping = false
            ended = true
            ns.get('stream/video').put(null)
          }
        })
      })
    } else if (stopping) {
      stopping = false
      ended = true
      ns.get('stream/video').put(null)
    }
  }
}

export function $(q) {
  const qsa = document.querySelectorAll(q)
  qsa.on = qsa.addEventListener

  if (qsa.length === 1) {
    qsa[0].on = qsa[0].addEventListener
    return qsa[0]
  }

  return qsa
}

export default $