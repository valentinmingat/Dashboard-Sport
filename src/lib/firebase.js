import { initializeApp, getApps } from 'firebase/app'
import {
  getAuth,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  onAuthStateChanged,
  signOut,
} from 'firebase/auth'
import {
  getFirestore,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  getDocs,
  collection,
  onSnapshot,
} from 'firebase/firestore'
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

export async function completeLoginWithLink(email, link) {
  if (!auth) throw new Error('Firebase not configured')
  if (!isSignInWithEmailLink(auth, link)) throw new Error('Not a valid sign-in link')
  await signInWithEmailLink(auth, email, link)
  window.localStorage.removeItem(PENDING_EMAIL_KEY)
}

export async function logout() {
  if (!auth) return
  await signOut(auth)
}

// --- Journal entries: one document per date, so every device's entries
// union automatically instead of needing a client-side array merge. ---

export async function fetchEntriesOnce(uid) {
  const snap = await getDocs(collection(db, 'users', uid, 'entries'))
  return snap.docs.map((d) => d.data())
}

export async function writeCloudEntry(uid, entry) {
  await setDoc(doc(db, 'users', uid, 'entries', entry.date), entry)
}

export async function deleteCloudEntry(uid, date) {
  await deleteDoc(doc(db, 'users', uid, 'entries', date))
}

export function subscribeEntries(uid, callback) {
  return onSnapshot(collection(db, 'users', uid, 'entries'), (snap) => {
    callback(
      snap.docs.map((d) => d.data()),
      snap.metadata.hasPendingWrites,
    )
  })
}

// --- Weight: goal settings as a single small doc, logs as one doc per date
// for the same union-friendly reason as entries. ---

export async function fetchGoalOnce(uid) {
  const snap = await getDoc(doc(db, 'users', uid, 'weight'))
  return snap.exists() ? snap.data() : null
}

export async function writeCloudGoal(uid, goal) {
  await setDoc(doc(db, 'users', uid, 'weight'), goal)
}

export function subscribeGoal(uid, callback) {
  return onSnapshot(doc(db, 'users', uid, 'weight'), (snap) => {
    if (!snap.exists()) return
    callback(snap.data(), snap.metadata.hasPendingWrites)
  })
}

export async function fetchWeightLogsOnce(uid) {
  const snap = await getDocs(collection(db, 'users', uid, 'weightLogs'))
  return snap.docs.map((d) => d.data())
}

export async function writeCloudWeightLog(uid, log) {
  await setDoc(doc(db, 'users', uid, 'weightLogs', log.date), log)
}

export async function deleteCloudWeightLog(uid, date) {
  await deleteDoc(doc(db, 'users', uid, 'weightLogs', date))
}

export function subscribeWeightLogs(uid, callback) {
  return onSnapshot(collection(db, 'users', uid, 'weightLogs'), (snap) => {
    callback(
      snap.docs.map((d) => d.data()),
      snap.metadata.hasPendingWrites,
    )
  })
}

// --- One-off migration from the old single-document format
// (users/{uid} holding the whole { entries, weight } blob). ---

export async function fetchLegacyDoc(uid) {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? snap.data() : null
}
