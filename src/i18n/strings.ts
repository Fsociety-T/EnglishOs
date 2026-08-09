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

  /* --------------------------------------------------------------- write -- */
  'write.title': 'Writing practice',
  'write.subtitle':
    'Pick a topic and write. Every mistake gets explained, and your weak areas become lessons.',
  'write.ownIdea': 'Write about your own idea',
  'write.ownIdeaSub': 'Or let the app choose a topic for you.',
  'write.ownPlaceholder': 'e.g. Why I want to change career',
  'write.start': 'Start',
  'write.surprise': 'Surprise me',
  'write.library': 'Or choose from the library',
  'write.changeTopic': 'Choose a different topic',
  'write.placeholder': 'Start writing. Do not worry about mistakes - finding them is the point.',
  'write.wordCount': '{count} / {target} words',
  'write.checking': 'Checking your writing...',
  'write.check': 'Check my writing',
  'write.tooShort': 'Write at least 10 words to get feedback.',
  'write.failed': 'Something went wrong. Your text is safe.',
  'write.ownCategory': 'Your own',

  /* --------------------------------------------------------------- speak -- */
  'speak.title': 'Speaking practice',
  'speak.subtitle':
    'Record yourself talking about a topic. You get a transcript, your speed, your filler words, and the same corrections as writing.',
  'speak.changeTopic': 'Choose a different topic',
  'speak.library': 'Or choose from the library',
  'speak.surprise': 'Surprise me',
  'speak.checking': 'Checking what you said...',
  'speak.check': 'Check my speaking',
  'speak.noSpeechApi':
    'Your browser cannot make a live transcript. Chrome or Edge can. You can still record and type what you said below, and it will be checked normally.',
  'speak.recordAgain': 'Record again',
  'speak.startRecording': 'Start recording',
  'speak.stop': 'Stop',
  'speak.listening': 'Listening. Speak naturally - aim for at least a minute.',
  'speak.reviewTranscript': 'Check the transcript below, then get your feedback.',
  'speak.pressRecord': 'Press record and talk about the topic above.',
  'speak.transcript': 'Transcript',
  'speak.transcriptFixable': 'Fix anything the transcription got wrong before checking.',
  'speak.transcriptLive': 'Updating as you speak.',
  'speak.transcriptPlaceholder': 'Type what you said, if the transcript is empty.',
  'speak.wordsPerMinute': '{count} words per minute',
  'speak.tooShort': 'Say or type at least 10 words to get feedback.',
  'speak.noIdea': 'Not sure what to talk about?',
  'speak.noIdeaSub': 'Let the app pick one for you.',
  'speak.chooseTopic': 'Choose a topic',
  'speak.failed': 'Something went wrong. Your transcript is safe.',

  /* ------------------------------------------------------------- lessons -- */
  'lessons.loading': 'Loading your lessons...',
  'lessons.title': 'Your grammar lessons',
  'lessons.subtitle':
    'Not a general course. Every lesson here exists because you made that mistake.',
  'lessons.weakAreas': 'Where your mistakes come from',
  'lessons.weakAreasSub': 'Across every session you have done.',
  'lessons.times': '{count} times',
  'lessons.once': '1 time',
  'lessons.emptyTitle': 'No lessons yet',
  'lessons.emptyBody':
    'Lessons appear automatically after you practise. Write or speak about a topic, and the mistakes you make become the lessons you need.',
  'lessons.all': 'All',
  'lessons.new': 'New',
  'lessons.learning': 'Learning',
  'lessons.mastered': 'Mastered',
  'lessons.questions': '{count} practice questions',
  'lessons.emptyGroup': 'Nothing in this group yet.',

  /* ----------------------------------------------------------- dashboard -- */
  'dash.morning': 'Good morning',
  'dash.afternoon': 'Good afternoon',
  'dash.evening': 'Good evening',
  'dash.notYet': 'You have not practised yet today. Ten minutes is enough to keep the streak alive.',
  'dash.already': 'You have already practised today. Anything more is a bonus.',
  'dash.ofGoal': 'of {goal} min',
  'dash.noStreak': 'No streak yet',
  'dash.streak': '{count}-day streak',
  'dash.goalDone': 'Daily goal complete. Well done.',
  'dash.goalLeft': '{count} more minutes to hit today’s goal.',
  'dash.bestStreak': ' Your best streak is {count} days.',
  'dash.startWriting': 'Start writing',
  'dash.startSpeaking': 'Start speaking',
  'dash.wordsWritten': 'Words written',
  'dash.speaking': 'Speaking',
  'dash.wordsSaved': 'Words saved',
  'dash.dueToReview': 'Due to review',
  'dash.continue': 'Pick up where you left off',
  'dash.writing': 'Writing',
  'dash.speakingKind': 'Speaking',
  'dash.words': 'words',
  'dash.whatNext': 'What do you want to do?',
  'dash.actionWrite': 'Write about a topic',
  'dash.actionWriteBody': 'Pick a prompt and get every mistake explained.',
  'dash.actionSpeak': 'Speak for two minutes',
  'dash.actionSpeakBody': 'Record yourself and get a fluency score.',
  'dash.actionWords': 'Review your words',
  'dash.actionWordsBody': 'Flashcards for the words that are due today.',
  'dash.actionLessons': 'Study a weak area',
  'dash.actionLessonsBody': 'Lessons built from the mistakes you actually make.',

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

  /* --------------------------------------------------------------- write -- */
  'write.title': 'Expression écrite',
  'write.subtitle':
    'Choisissez un sujet et écrivez. Chaque erreur est expliquée, et vos points faibles deviennent des leçons.',
  'write.ownIdea': 'Écrire sur votre propre idée',
  'write.ownIdeaSub': 'Ou laissez l’application choisir un sujet.',
  'write.ownPlaceholder': 'ex. Pourquoi je veux changer de métier',
  'write.start': 'Commencer',
  'write.surprise': 'Au hasard',
  'write.library': 'Ou choisissez dans la bibliothèque',
  'write.changeTopic': 'Choisir un autre sujet',
  'write.placeholder':
    'Commencez à écrire. Ne vous souciez pas des erreurs : les trouver, c’est tout l’intérêt.',
  'write.wordCount': '{count} / {target} mots',
  'write.checking': 'Correction de votre texte...',
  'write.check': 'Corriger mon texte',
  'write.tooShort': 'Écrivez au moins 10 mots pour recevoir un retour.',
  'write.failed': 'Une erreur est survenue. Votre texte est conservé.',
  'write.ownCategory': 'Votre sujet',

  /* --------------------------------------------------------------- speak -- */
  'speak.title': 'Expression orale',
  'speak.subtitle':
    'Enregistrez-vous en parlant d’un sujet. Vous obtenez une transcription, votre débit, vos mots parasites, et les mêmes corrections qu’à l’écrit.',
  'speak.changeTopic': 'Choisir un autre sujet',
  'speak.library': 'Ou choisissez dans la bibliothèque',
  'speak.surprise': 'Au hasard',
  'speak.checking': 'Analyse de ce que vous avez dit...',
  'speak.check': 'Corriger mon oral',
  'speak.noSpeechApi':
    'Votre navigateur ne peut pas transcrire en direct. Chrome ou Edge le peuvent. Vous pouvez quand même enregistrer et taper ce que vous avez dit ci-dessous : la correction fonctionnera normalement.',
  'speak.recordAgain': 'Réenregistrer',
  'speak.startRecording': 'Démarrer l’enregistrement',
  'speak.stop': 'Arrêter',
  'speak.listening': 'À l’écoute. Parlez naturellement - visez au moins une minute.',
  'speak.reviewTranscript': 'Vérifiez la transcription ci-dessous, puis lancez la correction.',
  'speak.pressRecord': 'Appuyez sur enregistrer et parlez du sujet ci-dessus.',
  'speak.transcript': 'Transcription',
  'speak.transcriptFixable': 'Corrigez ce que la transcription a mal compris avant de lancer l’analyse.',
  'speak.transcriptLive': 'Mise à jour pendant que vous parlez.',
  'speak.transcriptPlaceholder': 'Tapez ce que vous avez dit, si la transcription est vide.',
  'speak.wordsPerMinute': '{count} mots par minute',
  'speak.tooShort': 'Dites ou tapez au moins 10 mots pour recevoir un retour.',
  'speak.noIdea': 'Vous ne savez pas de quoi parler ?',
  'speak.noIdeaSub': 'Laissez l’application choisir pour vous.',
  'speak.chooseTopic': 'Choisir un sujet',
  'speak.failed': 'Une erreur est survenue. Votre transcription est conservée.',

  /* ------------------------------------------------------------- lessons -- */
  'lessons.loading': 'Chargement de vos leçons...',
  'lessons.title': 'Vos leçons de grammaire',
  'lessons.subtitle':
    'Ce n’est pas un cours général. Chaque leçon existe parce que vous avez fait cette erreur.',
  'lessons.weakAreas': 'D’où viennent vos erreurs',
  'lessons.weakAreasSub': 'Sur l’ensemble de vos sessions.',
  'lessons.times': '{count} fois',
  'lessons.once': '1 fois',
  'lessons.emptyTitle': 'Pas encore de leçons',
  'lessons.emptyBody':
    'Les leçons apparaissent automatiquement après vos exercices. Écrivez ou parlez sur un sujet, et vos erreurs deviennent les leçons dont vous avez besoin.',
  'lessons.all': 'Toutes',
  'lessons.new': 'Nouvelles',
  'lessons.learning': 'En cours',
  'lessons.mastered': 'Maîtrisées',
  'lessons.questions': '{count} questions d’entraînement',
  'lessons.emptyGroup': 'Rien dans ce groupe pour l’instant.',

  /* ----------------------------------------------------------- dashboard -- */
  'dash.morning': 'Bonjour',
  'dash.afternoon': 'Bon après-midi',
  'dash.evening': 'Bonsoir',
  'dash.notYet':
    'Vous n’avez pas encore pratiqué aujourd’hui. Dix minutes suffisent pour garder la série.',
  'dash.already': 'Vous avez déjà pratiqué aujourd’hui. Tout le reste est en bonus.',
  'dash.ofGoal': 'sur {goal} min',
  'dash.noStreak': 'Pas encore de série',
  'dash.streak': 'Série de {count} jours',
  'dash.goalDone': 'Objectif du jour atteint. Bravo.',
  'dash.goalLeft': 'Encore {count} minutes pour atteindre l’objectif du jour.',
  'dash.bestStreak': ' Votre meilleure série est de {count} jours.',
  'dash.startWriting': 'Commencer à écrire',
  'dash.startSpeaking': 'Commencer à parler',
  'dash.wordsWritten': 'Mots écrits',
  'dash.speaking': 'Expression orale',
  'dash.wordsSaved': 'Mots enregistrés',
  'dash.dueToReview': 'À réviser',
  'dash.continue': 'Reprendre où vous en étiez',
  'dash.writing': 'Écrit',
  'dash.speakingKind': 'Oral',
  'dash.words': 'mots',
  'dash.whatNext': 'Que voulez-vous faire ?',
  'dash.actionWrite': 'Écrire sur un sujet',
  'dash.actionWriteBody': 'Choisissez un sujet et faites expliquer chaque erreur.',
  'dash.actionSpeak': 'Parler deux minutes',
  'dash.actionSpeakBody': 'Enregistrez-vous et obtenez une note de fluidité.',
  'dash.actionWords': 'Réviser vos mots',
  'dash.actionWordsBody': 'Des cartes pour les mots à réviser aujourd’hui.',
  'dash.actionLessons': 'Travailler un point faible',
  'dash.actionLessonsBody': 'Des leçons bâties sur les erreurs que vous faites vraiment.',

  /* ---------------------------------------------------------- CEFR hints -- */
  'level.A1': 'Débutant - mots et phrases simples',
  'level.A2': 'Élémentaire - les bases du quotidien',
  'level.B1': 'Intermédiaire - à l’aise dans la plupart des situations courantes',
  'level.B2': 'Intermédiaire supérieur - à l’aise et assez fluide',
  'level.C1': 'Avancé - fluide et précis',
  'level.C2': 'Proche d’un locuteur natif',
}

export const STRINGS: Record<LearningLanguage, Record<StringKey, string>> = { en, fr }
