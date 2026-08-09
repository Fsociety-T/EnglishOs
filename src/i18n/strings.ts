import type { LearningLanguage } from '@/types'

/**
 * Every piece of interface text, in both languages.
 *
 * English is the source of truth: its key set defines StringKey, so a missing
 * French translation is a type error rather than a blank label discovered in
 * production. Keys are grouped by screen and read as `screen.thing`.
 *
 * Placeholders are `{name}` and are substituted by the `t` function.
 */
const en = {
  /* -------------------------------------------------------------- common -- */
  'common.save': 'Save changes',
  'common.saved': 'Saved',
  'common.cancel': 'Cancel',
  'common.loading': 'Loading...',
  'common.back': 'Back',
  'common.delete': 'Delete',
  'common.minutes': 'minutes',

  /* ----------------------------------------------------------------- nav -- */
  'nav.dashboard': 'Dashboard',
  'nav.write': 'Write',
  'nav.speak': 'Speak',
  'nav.lessons': 'Lessons',
  'nav.vocabulary': 'Words',
  'nav.podcasts': 'Podcasts',
  'nav.progress': 'Progress',
  'nav.settings': 'Settings',

  /* --------------------------------------------------------------- shell -- */
  'shell.tagline': 'Practice, get corrected, and turn your mistakes into lessons.',
  'shell.openMenu': 'Open menu',
  'shell.closeMenu': 'Close menu',
  'shell.streakTitle': '{count}-day practice streak',

  /* ---------------------------------------------------------------- auth -- */
  'auth.signIn': 'Sign in',
  'auth.createAccount': 'Create account',
  'auth.welcomeBack': 'Welcome back',
  'auth.createTitle': 'Create your account',
  'auth.createBlurb': 'Create an account to keep your practice in sync across devices.',
  'auth.signInBlurb': 'Sign in to continue practising and keep your progress synced.',
  'auth.email': 'Email address',
  'auth.password': 'Password',
  'auth.confirmPassword': 'Confirm password',
  'auth.passwordMismatch': 'Passwords do not match.',
  'auth.passwordTooShort': 'Choose a password with at least 6 characters.',
  'auth.creating': 'Creating account...',
  'auth.signingIn': 'Signing in...',
  'auth.genericError': 'Could not continue. Please try again.',
  'auth.securedBy': 'Your password is securely handled by Supabase.',
  'auth.confirmEmailError':
    'Account created, but email confirmation is enabled. Disable “Confirm email” in Supabase Auth settings to allow immediate password sign-in.',
  'auth.languageQuestion': 'Which language do you want to learn?',
  'auth.languageHint': 'You can change this later in Settings.',
  'auth.learnEnglish': 'English',
  'auth.learnFrench': 'French',

  /* ------------------------------------------------------------ settings -- */
  'settings.title': 'Settings',
  'settings.aboutYou': 'About you',
  'settings.nameLabel': 'What should the app call you?',
  'settings.namePlaceholder': 'Learner',
  'settings.languageLabel': 'Language you are learning',
  'settings.languageHint':
    'Changing this switches the whole app, including your lessons and practice topics.',
  'settings.levelLabel': 'Your {language} level',
  'settings.goalLabel': 'Daily goal:',
  'settings.goalHint': 'Small and daily beats long and rare. Fifteen minutes is a good start.',
  'settings.setup': 'How the app is set up',
  'settings.corrections': 'Corrections',
  'settings.correctionsReal': 'Your writing and speaking are reviewed by the full AI.',
  'settings.correctionsMock':
    'The offline engine reliably catches common mistakes, but it is not the full AI. Real AI review is the last step of the build.',
  'settings.yourData': 'Your data',
  'settings.dataCloud': 'Signed in as {email}. Everything syncs between your devices automatically.',
  'settings.dataLocal':
    'Everything is saved in this browser on this device. Export a backup below before clearing your browser data, or to move to another computer.',
  'settings.account': 'Account',
  'settings.signOut': 'Sign out',
  'settings.signOutBlurb':
    'Signing out leaves your data safe in the cloud. Sign back in on any device to pick up where you left off.',
  'settings.backup': 'Backup',
  'settings.backupSubtitle': 'Your sessions, lessons, words, podcasts and streak, as one file.',
  'settings.export': 'Export my data',
  'settings.import': 'Import a backup',
  'settings.importError': 'That file could not be read. Make sure it is an EnglishOS backup.',
  'settings.importWarning': 'Importing replaces everything currently saved. Export first if you are not sure.',
  'settings.reset': 'Start over',
  'settings.resetBlurb':
    'Deletes every session, lesson, word, podcast and streak on this device. This cannot be undone.',
  'settings.resetButton': 'Delete all my data',
  'settings.resetConfirm': 'Yes, delete everything',
  'settings.loading': 'Loading settings...',

  /* ---------------------------------------------------------- CEFR hints -- */
  'level.A1': 'Beginner - simple words and phrases',
  'level.A2': 'Elementary - everyday basics',
  'level.B1': 'Intermediate - can handle most daily situations',
  'level.B2': 'Upper intermediate - comfortable and fairly fluent',
  'level.C1': 'Advanced - fluent and precise',
  'level.C2': 'Near-native',
} as const

export type StringKey = keyof typeof en

const fr: Record<StringKey, string> = {
  /* -------------------------------------------------------------- common -- */
  'common.save': 'Enregistrer',
  'common.saved': 'Enregistré',
  'common.cancel': 'Annuler',
  'common.loading': 'Chargement...',
  'common.back': 'Retour',
  'common.delete': 'Supprimer',
  'common.minutes': 'minutes',

  /* ----------------------------------------------------------------- nav -- */
  'nav.dashboard': 'Tableau de bord',
  'nav.write': 'Écrire',
  'nav.speak': 'Parler',
  'nav.lessons': 'Leçons',
  'nav.vocabulary': 'Mots',
  'nav.podcasts': 'Podcasts',
  'nav.progress': 'Progrès',
  'nav.settings': 'Paramètres',

  /* --------------------------------------------------------------- shell -- */
  'shell.tagline': 'Pratiquez, faites-vous corriger, et transformez vos erreurs en leçons.',
  'shell.openMenu': 'Ouvrir le menu',
  'shell.closeMenu': 'Fermer le menu',
  'shell.streakTitle': 'Série de {count} jours de pratique',

  /* ---------------------------------------------------------------- auth -- */
  'auth.signIn': 'Se connecter',
  'auth.createAccount': 'Créer un compte',
  'auth.welcomeBack': 'Bon retour',
  'auth.createTitle': 'Créez votre compte',
  'auth.createBlurb': 'Créez un compte pour synchroniser votre pratique sur tous vos appareils.',
  'auth.signInBlurb': 'Connectez-vous pour continuer à pratiquer et garder vos progrès synchronisés.',
  'auth.email': 'Adresse e-mail',
  'auth.password': 'Mot de passe',
  'auth.confirmPassword': 'Confirmez le mot de passe',
  'auth.passwordMismatch': 'Les mots de passe ne correspondent pas.',
  'auth.passwordTooShort': 'Choisissez un mot de passe d’au moins 6 caractères.',
  'auth.creating': 'Création du compte...',
  'auth.signingIn': 'Connexion...',
  'auth.genericError': 'Impossible de continuer. Veuillez réessayer.',
  'auth.securedBy': 'Votre mot de passe est géré en toute sécurité par Supabase.',
  'auth.confirmEmailError':
    'Compte créé, mais la confirmation par e-mail est activée. Désactivez « Confirm email » dans les paramètres Supabase Auth pour permettre la connexion immédiate par mot de passe.',
  'auth.languageQuestion': 'Quelle langue voulez-vous apprendre ?',
  'auth.languageHint': 'Vous pourrez changer ce choix plus tard dans les Paramètres.',
  'auth.learnEnglish': 'Anglais',
  'auth.learnFrench': 'Français',

  /* ------------------------------------------------------------ settings -- */
  'settings.title': 'Paramètres',
  'settings.aboutYou': 'À propos de vous',
  'settings.nameLabel': 'Comment l’application doit-elle vous appeler ?',
  'settings.namePlaceholder': 'Apprenant',
  'settings.languageLabel': 'Langue que vous apprenez',
  'settings.languageHint':
    'Changer ce réglage bascule toute l’application, y compris vos leçons et vos sujets de pratique.',
  'settings.levelLabel': 'Votre niveau de {language}',
  'settings.goalLabel': 'Objectif quotidien :',
  'settings.goalHint':
    'Court et régulier vaut mieux que long et rare. Quinze minutes est un bon début.',
  'settings.setup': 'Configuration de l’application',
  'settings.corrections': 'Corrections',
  'settings.correctionsReal': 'Vos textes et votre expression orale sont corrigés par l’IA complète.',
  'settings.correctionsMock':
    'Le moteur hors ligne détecte de façon fiable les erreurs courantes, mais ce n’est pas l’IA complète. La correction par IA réelle est la dernière étape du projet.',
  'settings.yourData': 'Vos données',
  'settings.dataCloud':
    'Connecté en tant que {email}. Tout se synchronise automatiquement entre vos appareils.',
  'settings.dataLocal':
    'Tout est enregistré dans ce navigateur, sur cet appareil. Exportez une sauvegarde ci-dessous avant d’effacer les données de votre navigateur, ou pour changer d’ordinateur.',
  'settings.account': 'Compte',
  'settings.signOut': 'Se déconnecter',
  'settings.signOutBlurb':
    'La déconnexion laisse vos données en sécurité dans le cloud. Reconnectez-vous sur n’importe quel appareil pour reprendre où vous en étiez.',
  'settings.backup': 'Sauvegarde',
  'settings.backupSubtitle':
    'Vos sessions, leçons, mots, podcasts et votre série, dans un seul fichier.',
  'settings.export': 'Exporter mes données',
  'settings.import': 'Importer une sauvegarde',
  'settings.importError':
    'Ce fichier n’a pas pu être lu. Vérifiez qu’il s’agit bien d’une sauvegarde EnglishOS.',
  'settings.importWarning':
    'L’importation remplace tout ce qui est enregistré. Exportez d’abord si vous avez un doute.',
  'settings.reset': 'Tout recommencer',
  'settings.resetBlurb':
    'Supprime toutes les sessions, leçons, mots, podcasts et séries sur cet appareil. C’est irréversible.',
  'settings.resetButton': 'Supprimer toutes mes données',
  'settings.resetConfirm': 'Oui, tout supprimer',
  'settings.loading': 'Chargement des paramètres...',

  /* ---------------------------------------------------------- CEFR hints -- */
  'level.A1': 'Débutant - mots et phrases simples',
  'level.A2': 'Élémentaire - les bases du quotidien',
  'level.B1': 'Intermédiaire - à l’aise dans la plupart des situations courantes',
  'level.B2': 'Intermédiaire supérieur - à l’aise et assez fluide',
  'level.C1': 'Avancé - fluide et précis',
  'level.C2': 'Proche d’un locuteur natif',
}

export const STRINGS: Record<LearningLanguage, Record<StringKey, string>> = { en, fr }
