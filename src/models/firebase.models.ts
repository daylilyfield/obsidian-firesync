import type { FirebaseApp } from 'firebase/app'
import type { Auth as FirebaseAuth, User as FirebaseUser } from 'firebase/auth'
import type { Firestore } from 'firebase/firestore'
import type { FirebaseStorage } from 'firebase/storage'

export type FirebaseContext = {
  app: FirebaseApp
  auth: FirebaseAuth
  user: FirebaseUser
  firestore: Firestore
  storage: FirebaseStorage
}

export type UnauthenticatedFirebaseContext = Omit<FirebaseContext, 'user'>
