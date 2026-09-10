import { initializeApp, getApps } from 'firebase/app'
import {
  getAuth,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  onAuthStateChanged,
  signOut,
} from 'firebase/auth'
import { getFirestore, doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore'
import { firebaseConfig, isFirebaseConfigured } from './firebaseConfig'

const PENDING_EMAIL_KEY = 'sport-track:pending-email'

let app, auth, db

if (isFirebaseConfigured) {
  app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)
  auth = getAuth(app)
  db = getFirestore(app)
}

export function isConfigured() {
  return isFirebaseConfigured
}

export function watchAuth(callback) {
  if (!auth) return () => {}
  return onAuthStateChanged(auth, callback)
}

export async function sendLoginLink(email) {
  const actionCodeSettings = {
    url: window.location.href.split('?')[0],
    handleCodeInApp: true,
  }
  await sendSignInLinkToEmail(auth, email, actionCodeSettings)
  window.localStorage.setItem(PENDING_EMAIL_KEY, email)
}

export async function completeLoginIfNeeded() {
  if (!auth) return
  if (!isSignInWithEmailLink(auth, window.location.href)) return
  let email = window.localStorage.getItem(PENDING_EMAIL_KEY)
  if (!email) email = window.prompt('Confirme ton adresse email pour terminer la connexion :')
  if (!email) return
  await signInWithEmailLink(auth, email, window.location.href)
  window.localStorage.removeItem(PENDING_EMAIL_KEY)
  window.history.replaceState({}, '', window.location.pathname)
}

export async function logout() {
  if (!auth) return
  await signOut(auth)
}

export async function pullCloudData(uid) {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? snap.data() : null
}

export async function pushCloudData(uid, data) {
  await setDoc(doc(db, 'users', uid), { ...data, updatedAt: Date.now() })
}

export function subscribeCloudData(uid, callback) {
  return onSnapshot(doc(db, 'users', uid), (snap) => {
    if (!snap.exists()) return
    callback(snap.data(), snap.metadata.hasPendingWrites)
  })
}
