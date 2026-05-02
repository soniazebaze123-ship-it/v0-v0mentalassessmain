"use client"

import type React from "react"
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"

type Language = "en" | "zh" | "yue" | "fr"

type TranslationMap = Record<string, string | string[]>
type InterpolationValues = Record<string, string | number | boolean | null | undefined>

interface SpeechSettings {
  lang: string
  rate: number
  pitch: number
  volume: number
}

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, options?: InterpolationValues) => string
  localizeText: (englishText: string, overrides?: Partial<Record<Language, string>>) => string
  getLanguageName: (lang: Language) => string
  getSpeechLanguage: (lang: Language) => string
  getSpeechSettings: (lang?: Language) => SpeechSettings
  getBestVoice: (lang?: Language) => SpeechSynthesisVoice | null
}

const englishTranslations: TranslationMap = {
  // Language names
  "language.english": "English",
  "language.chinese": "中文",
  "language.cantonese": "廣東話",
  "language.french": "Français",

  // Audio instructions
  "audio.instruction": "🔊 Audio Instruction",
  "audio.instruction_playing": "🔊 Playing...",
  "audio.instruction_error": "Audio instruction not available",
  "audio.error_playing": "Error playing audio. Please try again.",
  "audio.not_supported": "Speech synthesis not supported in this browser.",
  "audio.play": "Play Audio",
  "audio.playing": "Playing...",
  "audio.played_success": "✓ Audio played. Now type what you heard below.",

  // Audio sentence files
  "audio.moca_sentence_en_path": "/audio/moca_sentence_en.mp3",
  "audio.moca_sentence_zh_path": "/audio/moca_sentence_zh.mp3",
  "audio.mmse_sentence_en_path": "/audio/mmse_sentence_en.mp3",
  "audio.mmse_sentence_zh_path": "/audio/mmse_sentence_zh.mp3",

  // Registration & Login
  "register.title": "Register with Phone Number",
  "register.name": "Name",
  "register.name.placeholder": "Enter your full name",
  "register.date_of_birth": "Date of Birth",
  "register.date_of_birth.placeholder": "Select your birth date",
  "register.date_of_birth.year": "Year",
  "register.date_of_birth.month": "Month",
  "register.date_of_birth.day": "Day",
  "register.gender": "Gender",
  "register.gender.placeholder": "Select gender",
  "register.gender.male": "Male",
  "register.gender.female": "Female",
  "register.gender.other": "Other",
  "register.gender.prefer_not_to_say": "Prefer not to say",
  phone: "Phone Number",
  "register.submit": "Register",
  "register.error.invalid": "Please enter a valid phone number",
  "register.error.exists": "Phone number already registered",
  "register.password": "Password",
  "register.password.placeholder": "Create a password",
  "register.confirm_password": "Confirm password",
  "register.confirm_password.placeholder": "Re-enter your password",
  "register.error.password_short": "Password must be at least 8 characters.",
  "register.error.password_mismatch": "Passwords do not match.",
  "login.title": "Login with Phone Number",
  "login.submit": "Login",
  "login.error.notfound": "Phone number not found",
  "login.error.invalid_credentials": "Invalid phone number or password.",
  "login.admin": "Admin Login",
  "login.enter_phone": "Enter your registered phone number to continue",
  "login.password": "Password",
  "login.password.placeholder": "Enter your password",
  "login.remember_phone": "Remember phone number on this device",
  "login.new_user": "New User? Register Here",
  "login.already_account": "Already have an account? Login here",
  "registration.description": "Enter your phone number to begin the mental health assessment",
  "dummy_pin.label": "Dummy PIN",
  "dummy_pin.placeholder.login": "Enter Dummy PIN",
  "dummy_pin.placeholder.register": "Create Dummy PIN",

  // Dashboard
  "dashboard.title": "Mental Health Assessment Dashboard",
  "dashboard.test_once_per_day": "You can only take this test once per day. Please try again tomorrow.",
  "dashboard.moca": "Montreal Cognitive Assessment (MoCA)",
  "dashboard.moca.description": "Montreal Cognitive Assessment - 30 points total",
  "dashboard.mmse": "Mini-Mental State Examination (MMSE)",
  "dashboard.mmse.description": "Mini-Mental State Examination - 30 points total",
  "dashboard.upload": "Chinese Traditional Medicine (TCM) Image Upload",
  "dashboard.upload.description": "Upload medical images and documents",
  "dashboard.completed": "Completed",
  "dashboard.pending": "Pending",
  "dashboard.resume": "Resume Assessment",
  "dashboard.view_results": "View Results",
  "dashboard.retake": "Retake",
  "dashboard.confirm_retake": "Confirm Retake",
  "dashboard.score": "Score",
  "dashboard.results_final": "Assessment completed. Results are final.",
  "dashboard.manage_files": "Manage Files",
  "dashboard.upload_files": "Upload Files",
  "dashboard.files_uploaded": "Files uploaded: {count}",
  "dashboard.name": "Name",
  "dashboard.id": "ID",
  "dashboard.phone": "Phone",
  "dashboard.logout": "Logout",
  "dashboard.sensory": "Sensory Screening",
  "dashboard.sensory.description": "Visual, auditory, and olfactory function tests",
  "dashboard.multimodal": "Multimodal Cognitive Intelligence",
  "dashboard.multimodal.description": "EEG, sensory markers, and blood biomarkers for early cognitive staging.",

  // MoCA
  "moca.title": "Montreal Cognitive Assessment",
  "moca.visuospatial": "Visuospatial Skills - Clock Drawing",
  "moca.visuospatial.instruction": "Drag the clock hands to show the time: 10 after 2 (2:10)",
  "moca.executive": "Executive Function - Trail Making",
  "moca.executive.instruction":
    "Connect the circles in alternating order: 1-A-2-B-3-C-4-D. Circles 1, A, and 2 are pre-connected.",
  "moca.cube": "Visuospatial Skills - Cube Copy",
  "moca.cube.instruction": "Look at the cube below and copy the drawing.",
  "moca.naming": "Naming Objects",
  "moca.naming.instruction": "Look at each image and tap the correct object name.",
  "moca.memory": "Memory Tasks",
  "moca.memory.instruction": "You will be shown {count} words one by one. Remember them for later recall.",
  "moca.attention": "Attention Tasks",
  "moca.attention.instruction": "Look carefully at the image and count the number of dogs you can see.",
  "moca.language": "Language & Abstraction",
  "moca.language.instruction": "Listen carefully and complete the tasks.",
  "moca.orientation": "Orientation",
  "moca.orientation.instruction": "Please answer the following questions about the current date and location.",

  // MMSE
  "mmse.title": "Mini-Mental State Examination",
  "mmse.orientation": "Orientation",
  "mmse.orientation.instruction": "Please answer the following questions about time and place.",
  "mmse.orientation.time_questions": "Time Questions (5 points)",
  "mmse.orientation.place_questions": "Place Questions (3 points)",
  "mmse.registration": "Registration & Recall",
  "mmse.registration.instruction": "Remember the words and type them back during the recall phase.",
  "mmse.attention": "Attention & Calculation",
  "mmse.attention.instruction": "Please solve the subtraction questions by subtracting 7 each time from 100.",
  "mmse.naming": "Naming Objects",
  "mmse.naming.instruction": "Look at each image and tap the correct item name.",
  "mmse.repetition": "Repetition",
  "mmse.repetition.instruction": "Listen carefully to the sentence and type exactly what you hear.",
  "mmse.repetition.target.en": "He drew a picture",
  "mmse.repetition.target.zh": "他画了一幅画",
  "mmse.repetition.target.yue": "佢畫咗一幅畫",
  "mmse.repetition.target.fr": "Il a dessiné une image",
  "mmse.writing": "Writing",
  "mmse.writing.instruction": "Tap the subject and predicate in the correct order to make a simple sentence.",
  "mmse.writing.subject_1": "I",
  "mmse.writing.predicate_1": "eat rice.",
  "mmse.writing.subject_2": "The fish",
  "mmse.writing.predicate_2": "can swim.",
  "mmse.writing.subject_3": "The egg",
  "mmse.writing.predicate_3": "is round.",
  "mmse.copying": "Copying Design",
  "mmse.copying.instruction": "Look at the shape below and copy the design.",

  // Questions
  "question.date": "What is today's date?",
  "question.month": "What is the current month?",
  "question.year": "What is the current year?",
  "question.day": "What day of the week is it?",
  "question.country": "What country are we in?",
  "question.season": "What season is it?",
  "question.president": "Who is the current president?",
  "question.sea": "Name a sea:",
  "question.similarity": "In what way are a train and a bicycle alike?",
  "question.dogs": "How many dogs do you see?",
  "question.angles": "How many angles does this shape have?",
  "question.subtract_series": "Serial subtraction",
  "question.subtract": "What is 10 minus 7?",
  "question.add": "What should we add to 4 to get 7?",
  "question.your_answer": "Your answer:",
  "question.type_sentence": "Type the sentence you heard:",
  "question.write_sentence": "Build the sentence:",
  "question.tap_correct_name": "Tap the correct name.",
  "question.select_sentence_order": "Tap the subject and predicate in the correct order.",
  "question.built_sentence": "Built sentence:",
  "question.animal_label": "Animal {index}:",
  "question.object_label": "Object {index}:",

  // Supplemental naming/writing content
  "common.rice": "rice",
  "common.noodles": "noodles",
  "common.milk": "milk",
  "common.chicken": "chicken",
  "common.fish": "fish",
  "common.egg": "egg",
  "common.house": "house",
  "common.bag": "bag",
  "common.tv": "television",
  "common.reset": "Reset",

  // Memory words
  "memory.moca.words": ["Face", "Velvet", "Church", "Daisy", "Red"],
  "memory.mmse.words": ["Apple", "Table", "Penny"],
  "memory.get_ready": "Get ready! Words will appear in {countdown} seconds...",
  "memory.word_of": "Word {current} of {total}",
  "memory.preparing_recall": "Preparing recall phase...",
  "memory.recall_instruction": "Please type the {count} words you just saw, in any order.",
  "memory.submit_recall": "Submit Recall",

  // Upload
  "upload.instruction": "Upload your medical images and documents. Supported formats: PNG, JPEG, PDF (max 10MB each)",
  "upload.drag_drop": "Drop files here or click to browse",
  "upload.file_types": "PNG, JPEG, PDF files up to 10MB each",
  "upload.error.invalid_file_type_size": "Please select valid files (PNG, JPEG, PDF) under 10MB",
  "upload.error.failed": "Upload failed",
  "upload.error.remove_failed": "Failed to remove file",
  "upload.uploading": "Uploading files...",
  "upload.uploaded_files": "Uploaded Files ({count})",
  "upload.complete_section": "Complete Upload Section",
  "upload.using_uploaded_images": "Using your uploaded images for this task.",

  // Results Display
  "results.title": "{assessmentType} Assessment Results",
  "results.score_percentage": "{percentage}% Score",
  "results.section_breakdown": "Section Breakdown",
  "results.points": "{score} points",
  "results.back_to_dashboard": "Back to Dashboard",
  "results.interpretation.normal": "Normal",
  "results.interpretation.mild_impairment": "Mild Cognitive Impairment",
  "results.interpretation.possible_decline": "Possible Cognitive Decline",
  "results.interpretation.severe_impairment": "Severe Cognitive Impairment",
  "results.moca.normal_range": "26-30: Normal cognition",
  "results.moca.mild_range": "18-25: Mild cognitive impairment",
  "results.moca.decline_range": "<18: Possible cognitive decline",
  "results.mmse.normal_range": "21-28: Normal cognition",
  "results.mmse.mild_range": "15-20: Mild cognitive impairment",
  "results.mmse.severe_range": "<14: Severe cognitive impairment",

  // Admin Panel
  "admin.title": "Admin Dashboard",
  "admin.login_title": "Admin Login",
  "admin.username": "Username",
  "admin.password": "Password",
  "admin.login_button": "Login",
  "admin.view_assessments": "View Assessments",
  "admin.view_files": "View Files",
  "admin.export_csv": "Export CSV",
  "admin.total_users": "Total Users",
  "admin.completed_assessments": "Completed Assessments",
  "admin.avg_moca_score": "Avg MoCA Score",
  "admin.uploaded_files": "Uploaded Files",
  "admin.registered": "Registered",
  "admin.assessments_count": "{count} assessments",
  "admin.files_count": "{count} files",
  "admin.completed_count": "{count} completed",
  "admin.in_progress_count": "{count} in progress",
  "admin.select_user": "Select a user to view their details",
  "admin.user_files": "User Files",
  "admin.assessment_details": "Assessment Details",
  "admin.no_files_uploaded": "No files uploaded by this user",
  "admin.no_completed_assessments": "No completed assessments by this user",
  "admin.no_progress_assessments": "No assessments in progress for this user",
  "admin.last_updated": "Last Updated",
  "admin.current_step": "Current Step",
  "admin.scores_so_far": "Scores so far",
  "admin.total_score": "Total Score",
  "admin.section_scores": "Section Scores",
  "admin.laboratory_analysis": "Laboratory Analysis:",
  "admin.enter_analysis": "Enter laboratory analysis...",
  "admin.update_analysis": "Update Analysis",
  "admin.registered_users": "Registered Users",
  "admin.assessments_in_progress": "Assessments in Progress",
  "admin.avg_scores_title": "Average Assessment Scores",
  "admin.score_distribution_title": "Score Distribution",
  "admin.progress_trend_title": "Assessment Progress Trends Over Time",
  "admin.select_user_filter": "Select User",
  "admin.all_users": "All Users",
  "admin.select_assessment_type": "Select Assessment Type",
  "admin.all_assessments": "All Assessments",

  // Risk Scoring
  "risk.level.low": "Low Risk",
  "risk.level.moderate": "Moderate Risk",
  "risk.level.high": "High Risk",
  "risk.level.very_high": "Very High Risk",
  "risk.overall_score": "Overall Risk Score",
  "risk.cognitive_component": "Cognitive Component",
  "risk.sensory_component": "Sensory Component",
  "risk.recommendations": "Recommendations",
  "risk.factors": "Risk Factors",
  "risk.factor.cognitive_impairment": "Cognitive Impairment Detected",
  "risk.factor.sensory_impairment": "Sensory Impairment Detected",
  "risk.factor.multiple_sensory": "Multiple Sensory Deficits",
  "risk.severity": "Severity Level",
  "risk.severity.normal": "Normal",
  "risk.severity.mild": "Mild",
  "risk.severity.moderate": "Moderate",
  "risk.severity.severe": "Severe",
  "risk.profile_title": "Dementia Risk Profile",
  "risk.no_data": "Complete assessments to view your risk profile",
  "risk.view_profile": "View Risk Profile",

  // Theme
  "theme.light": "Light Mode",
  "theme.dark": "Dark Mode",
  "theme.system": "System",

  // Common
  "common.assessment": "Assessment",
  "common.step": "Step",
  "common.of": "of",
  "common.progress": "Progress",
  "common.next": "Next",
  "common.submit": "Submit",
  "common.back": "Back",
  "common.score": "Score",
  "common.total": "Total",
  "common.loading": "Loading...",
  "common.login": "Login",
  "common.logout": "Logout",
  "common.resume": "Resume",
  "common.start": "Start Assessment",
  "common.view_results": "View Results",
  "common.retake": "Retake",
  "common.confirm_retake": "Confirm Retake",
  "common.skip_task": "Skip Task",
  "common.animal": "Animal",
  "common.object": "Object",
  "common.television": "television",
  "common.tiger": "tiger",
  "common.rhinoceros": "rhinoceros",
  "common.camel": "camel",
  "common.house": "house",
  "common.bag": "bag",
  "common.walk": "walk",
  "common.run": "run",
  "common.wheel": "wheel",
  "common.jump": "jump",
  "common.word": "Word",
  "common.president_name": "xi jinping",
  "common.china": "china",
  "common.spring": "spring",
  "common.summer": "summer",
  "common.autumn": "autumn",
  "common.winter": "winter",
  "common.month_1": "January",
  "common.month_2": "February",
  "common.month_3": "March",
  "common.month_4": "April",
  "common.month_5": "May",
  "common.month_6": "June",
  "common.month_7": "July",
  "common.month_8": "August",
  "common.month_9": "September",
  "common.month_10": "October",
  "common.month_11": "November",
  "common.month_12": "December",
  "common.day_sunday": "Sunday",
  "common.day_monday": "Monday",
  "common.day_tuesday": "Tuesday",
  "common.day_wednesday": "Wednesday",
  "common.day_thursday": "Thursday",
  "common.day_friday": "Friday",
  "common.day_saturday": "Saturday",
  "common.continue": "Continue",

  // Sensory Screening - Visual
  "sensory.visual.title": "Visual Acuity Screening",
  "sensory.visual.description": "Test your visual acuity using the tumbling-E test",
  "sensory.visual.instruction":
    "You will see the letter 'E' pointing in different directions. Select which way it is pointing.",
  "sensory.visual.setup_title": "Test Setup Instructions:",
  "sensory.visual.setup_1": "Sit in a well-lit room",
  "sensory.visual.setup_2": "Hold device at arm's length (40cm) or place 2 meters away",
  "sensory.visual.setup_3": "Cover one eye at a time (test each eye separately if possible)",
  "sensory.visual.setup_4": "Select the direction the 'E' is pointing",
  "sensory.visual.viewing_distance": "Choose your viewing distance:",
  "sensory.visual.distance_far": "2 meters (far)",
  "sensory.visual.distance_near": "40cm (near)",
  "sensory.visual.start_test": "Start Visual Test",
  "sensory.visual.level": "Level",
  "sensory.visual.trial": "Trial",
  "sensory.visual.which_direction": "Which direction is the 'E' pointing?",
  "sensory.visual.complete_title": "Visual Screening Complete",
  "sensory.visual.complete_message": "Thank you for completing the visual acuity test.",

  // Sensory Screening - Auditory
  "sensory.auditory.title": "Hearing Screening",
  "sensory.auditory.description": "Test your hearing using the digit-in-noise test",
  "sensory.auditory.instruction": "Listen to digits played with background noise and type what you hear.",
  "sensory.auditory.setup_title": "Test Setup Instructions:",
  "sensory.auditory.setup_1": "Find a quiet environment",
  "sensory.auditory.setup_2": "Use headphones for best results",
  "sensory.auditory.setup_3": "Set volume to a comfortable listening level",
  "sensory.auditory.setup_4": "Listen carefully and type the digit you hear",
  "sensory.auditory.audio_setup": "Audio Setup:",
  "sensory.auditory.headphones": "Headphones",
  "sensory.auditory.speakers": "Speakers",
  "sensory.auditory.volume_confirm": "I have set my volume to a comfortable level",
  "sensory.auditory.volume_warning": "Please confirm you have set your volume to a comfortable level",
  "sensory.auditory.start_test": "Start Hearing Test",
  "sensory.auditory.trial": "Trial",
  "sensory.auditory.snr_level": "Difficulty Level",
  "sensory.auditory.listening": "Listening...",
  "sensory.auditory.ready": "Ready to listen",
  "sensory.auditory.replay": "Replay Audio",
  "sensory.auditory.enter_digit": "Enter the digit you heard (0-9):",
  "sensory.auditory.complete_title": "Hearing Screening Complete",
  "sensory.auditory.complete_message": "Thank you for completing the hearing test.",

  // Sensory Screening - Olfactory
  "sensory.olfactory.title": "Smell Identification Test",
  "sensory.olfactory.description": "Identify common smells to assess olfactory function",
  "sensory.olfactory.instruction":
    "You will be shown images of items. Select which smell they represent.",
  "sensory.olfactory.setup_title": "Test Instructions:",
  "sensory.olfactory.setup_1": "This is a visual smell identification test",
  "sensory.olfactory.setup_2": "Look at each image and identify the item",
  "sensory.olfactory.setup_3": "Select the correct item from the options shown",
  "sensory.olfactory.setup_4": "Trust your first instinct",
  "sensory.olfactory.note":
    "Note: This is a visual identification test. For clinical assessment, physical smell testing is recommended.",
  "sensory.olfactory.start_test": "Start Smell Test",
  "sensory.olfactory.trial": "Question",
  "sensory.olfactory.select_smell": "Which item is shown in the image?",
  "sensory.olfactory.correct": "Correct!",
  "sensory.olfactory.incorrect": "Incorrect",
  "sensory.olfactory.complete_title": "Smell Identification Complete",
  "sensory.olfactory.complete_message": "Thank you for completing the smell identification test.",
  "sensory.olfactory.smell.rose": "Rose",
  "sensory.olfactory.smell.lemon": "Lemon",
  "sensory.olfactory.smell.coffee": "Coffee",
  "sensory.olfactory.smell.mint": "Mint",
  "sensory.olfactory.smell.orange": "Orange",
  "sensory.olfactory.smell.soap": "Soap",
  "sensory.olfactory.smell.vanilla": "Vanilla",
  "sensory.olfactory.smell.garlic": "Garlic",
  "sensory.olfactory.smell.chocolate": "Chocolate",
  "sensory.olfactory.smell.pineapple": "Pineapple",
  "sensory.olfactory.smell.cinnamon": "Cinnamon",
  "sensory.olfactory.smell.grass": "Grass",

  // Multimodal
  "multimodal.title": "Multimodal Cognitive Intelligence",
  "multimodal.description": "EEG, sensory markers, and blood biomarkers for early cognitive staging.",
  "multimodal.eeg_erp": "EEG / ERP",
  "multimodal.sensory": "Sensory Intelligence",
  "multimodal.blood": "Blood Biomarkers",
  "multimodal.guidance": "Clinical Guidance",
  "multimodal.probable_ad": "Probable AD Profile",
  "multimodal.mixed_non_ad": "Mixed / Non-AD",
  "multimodal.specialist_referral": "Specialist Referral",
  "multimodal.save": "Save Multimodal Assessment",
  "multimodal.user_id": "User ID",
  "multimodal.notes": "Clinical Notes",
  "multimodal.risk": "Composite Risk Level",
  "multimodal.stage.normal": "Normal Cognition",
  "multimodal.stage.at_risk": "At-Risk Cognitive Decline",
  "multimodal.stage.early_mci": "Early MCI",
  "multimodal.stage.intermediate_mci": "Intermediate MCI",
  "multimodal.stage.advanced_mci": "Advanced MCI",
  "multimodal.stage.mild_dementia": "Mild Dementia",
  "multimodal.stage.moderate_dementia": "Moderate Dementia",
  "multimodal.stage.severe_dementia": "Severe Dementia",
}

const zhOverrides: TranslationMap = {
  "audio.instruction": "🔊 语音提示",
  "audio.instruction_playing": "🔊 播放中...",
  "audio.instruction_error": "语音提示不可用",
  "audio.error_playing": "播放语音时出错，请重试。",
  "audio.not_supported": "当前浏览器不支持语音合成。",
  "audio.play": "播放语音",
  "audio.playing": "播放中...",

  "register.title": "手机号注册",
  "register.name": "姓名",
  "register.name.placeholder": "请输入您的姓名",
  "register.date_of_birth": "出生日期",
  "register.date_of_birth.placeholder": "请选择出生日期",
  "register.date_of_birth.year": "年份",
  "register.date_of_birth.month": "月份",
  "register.date_of_birth.day": "日期",
  "register.gender": "性别",
  "register.gender.placeholder": "请选择性别",
  "register.gender.male": "男",
  "register.gender.female": "女",
  "register.gender.other": "其他",
  "register.gender.prefer_not_to_say": "不愿透露",
  phone: "手机号",
  "register.submit": "注册",
  "register.password": "密码",
  "register.password.placeholder": "创建密码",
  "register.confirm_password": "确认密码",
  "register.confirm_password.placeholder": "再次输入密码",
  "register.error.password_short": "密码至少需要 8 个字符。",
  "register.error.password_mismatch": "两次输入的密码不一致。",
  "login.title": "手机号登录",
  "login.submit": "登录",
  "login.admin": "管理员登录",
  "login.enter_phone": "请输入已注册的手机号继续",
  "login.password": "密码",
  "login.password.placeholder": "请输入密码",
  "login.error.invalid_credentials": "手机号或密码不正确。",
  "login.remember_phone": "在此设备上记住手机号",
  "login.new_user": "新用户？点此注册",
  "login.already_account": "已有账号？点此登录",
  "registration.description": "请输入手机号以开始心理健康评估",

  "dashboard.title": "心理健康评估面板",
  "dashboard.name": "姓名",
  "dashboard.id": "编号",
  "dashboard.phone": "电话",
  "dashboard.resume": "继续评估",
  "dashboard.retake": "重新测试",
  "dashboard.confirm_retake": "确认重测",
  "dashboard.logout": "退出登录",
  "dashboard.multimodal": "多模态认知智能",
  "dashboard.multimodal.description": "结合 EEG、感觉标志物与血液生物标志物进行早期认知分期。",

  "moca.title": "蒙特利尔认知评估",
  "moca.visuospatial": "视空间能力 - 时钟绘制",
  "moca.visuospatial.instruction": "请拖动时钟指针，显示 2 点 10 分。",
  "moca.executive": "执行功能 - 连线测试",
  "moca.executive.instruction": "请按交替顺序连接圆圈：1-A-2-B-3-C-4-D。1、A 和 2 已经连好。",
  "moca.cube": "视空间能力 - 立方体临摹",
  "moca.cube.instruction": "请观察下方立方体，并照样画出来。",
  "moca.naming": "物品命名",
  "moca.naming.instruction": "请看每一张图片，并点击正确的物品名称。",
  "moca.memory": "记忆任务",
  "moca.memory.instruction": "系统会逐个显示 {count} 个词语，请记住它们，稍后进行回忆。",
  "moca.attention": "注意力任务",
  "moca.attention.instruction": "请仔细观察图片，并数出你能看到多少只狗。",
  "moca.language": "语言与抽象",
  "moca.language.instruction": "请认真听并完成任务。",
  "moca.orientation": "定向力",
  "moca.orientation.instruction": "请回答以下关于当前日期和地点的问题。",

  "mmse.title": "简易精神状态检查",
  "mmse.orientation": "定向力",
  "mmse.orientation.instruction": "请回答以下关于时间和地点的问题。",
  "mmse.orientation.time_questions": "时间问题（5分）",
  "mmse.orientation.place_questions": "地点问题（3分）",
  "mmse.registration": "记忆登记与回忆",
  "mmse.registration.instruction": "请先记住这些词语，并在回忆阶段输入出来。",
  "mmse.attention": "注意力与计算",
  "mmse.attention.instruction": "请从 100 开始，每次减去 7，完成下面的计算题。",
  "mmse.naming": "物体命名",
  "mmse.naming.instruction": "请看每一张图片，并点击正确的项目名称。",
  "mmse.repetition": "复述",
  "mmse.repetition.instruction": "请认真听句子，并准确输入你听到的内容。",
  "mmse.writing": "书写",
  "mmse.writing.instruction": "请按正确顺序点击主语和谓语，组成一个简单完整的句子。",
  "mmse.writing.subject_1": "我",
  "mmse.writing.predicate_1": "吃饭。",
  "mmse.writing.subject_2": "鱼",
  "mmse.writing.predicate_2": "会游泳。",
  "mmse.writing.subject_3": "鸡蛋",
  "mmse.writing.predicate_3": "是圆的。",
  "mmse.copying": "图形复制",
  "mmse.copying.instruction": "请观察下方图形，并照样画出来。",

  "memory.get_ready": "做好准备，词语将在 {countdown} 秒后出现...",
  "memory.moca.words": ["面孔", "天鹅绒", "教堂", "雏菊", "红色"],
  "memory.mmse.words": ["苹果", "桌子", "硬币"],
  "memory.word_of": "第 {current} 个词，共 {total} 个",
  "memory.preparing_recall": "正在准备回忆阶段...",
  "memory.recall_instruction": "请按任意顺序输入你刚才看到的 {count} 个词语。",
  "memory.submit_recall": "提交回忆",
  "common.submit": "提交",
  "common.skip_task": "跳过任务",
  "audio.played_success": "✓ 语音已播放。现在请在下方输入你听到的内容。",

  "question.date": "今天是几号？",
  "question.month": "现在是几月？",
  "question.year": "现在是哪一年？",
  "question.day": "今天是星期几？",
  "question.country": "我们现在在哪个国家？",
  "question.season": "现在是什么季节？",
  "question.president": "现任国家主席是谁？",
  "question.sea": "请说出一个海的名称：",
  "question.angles": "这个图形有几个角？",
  "question.subtract_series": "连续减法",
  "question.type_sentence": "请输入你听到的句子：",
  "question.write_sentence": "请组成句子：",
  "question.tap_correct_name": "请点击正确的名称。",
  "question.select_sentence_order": "请按正确顺序点击主语和谓语。",
  "question.built_sentence": "已组成句子：",

  "question.animal_label": "动物 {index}：",
  "question.object_label": "物体 {index}：",

  "common.animal": "动物",
  "common.object": "物体",
  "common.television": "电视",
  "common.tiger": "老虎",
  "common.rhinoceros": "犀牛",
  "common.camel": "骆驼",
  "common.house": "房子",
  "common.bag": "包",
  "common.word": "词语",

  "results.title": "{assessmentType} 评估结果",
  "results.score_percentage": "{percentage}% 得分",
  "results.section_breakdown": "分项结果",
  "results.points": "{score} 分",
  "results.back_to_dashboard": "返回首页",
  "results.interpretation.normal": "正常",
  "results.interpretation.mild_impairment": "轻度认知障碍",
  "results.interpretation.possible_decline": "可能存在认知下降",
  "results.interpretation.severe_impairment": "重度认知障碍",
  "results.moca.normal_range": "26-30：认知正常",
  "results.moca.mild_range": "18-25：轻度认知障碍",
  "results.moca.decline_range": "<18：可能存在认知下降",
  "results.mmse.normal_range": "21-28：认知正常",
  "results.mmse.mild_range": "15-20：轻度认知障碍",
  "results.mmse.severe_range": "<14：重度认知障碍",

  "admin.title": "管理员面板",
  "admin.login_title": "管理员登录",
  "admin.username": "用户名",
  "admin.password": "密码",
  "admin.login_button": "登录",
  "admin.registered_users": "注册用户",
  "admin.assessments_in_progress": "进行中的评估",

  "risk.level.low": "低风险",
  "risk.level.moderate": "中风险",
  "risk.level.high": "高风险",
  "risk.level.very_high": "极高风险",
  "risk.profile_title": "痴呆风险概况",
  "risk.view_profile": "查看风险概况",

  "theme.light": "浅色模式",
  "theme.dark": "深色模式",
  "theme.system": "系统",

  "common.loading": "加载中...",
  "common.assessment": "评估",
  "common.step": "第",
  "common.of": "共",
  "common.progress": "进度",
  "common.next": "下一步",
  "common.login": "登录",
  "common.logout": "退出登录",
  "common.resume": "继续",
  "common.start": "开始评估",
  "common.view_results": "查看结果",
  "common.retake": "重新测试",
  "common.confirm_retake": "确认重测",
  "common.continue": "继续",
  "common.president_name": "习近平",
  "common.china": "中国",
  "common.rice": "米饭",
  "common.noodles": "面条",
  "common.milk": "牛奶",
  "common.chicken": "鸡肉",
  "common.fish": "鱼",
  "common.egg": "鸡蛋",
  "common.house": "房子",
  "common.bag": "包包",
  "common.tv": "电视",
  "common.spring": "春天",
  "common.summer": "夏天",
  "common.autumn": "秋天",
  "common.winter": "冬天",
  "common.month_1": "一月",
  "common.month_2": "二月",
  "common.month_3": "三月",
  "common.month_4": "四月",
  "common.month_5": "五月",
  "common.month_6": "六月",
  "common.month_7": "七月",
  "common.month_8": "八月",
  "common.month_9": "九月",
  "common.month_10": "十月",
  "common.month_11": "十一月",
  "common.month_12": "十二月",
  "common.day_sunday": "星期日",
  "common.day_monday": "星期一",
  "common.day_tuesday": "星期二",
  "common.day_wednesday": "星期三",
  "common.day_thursday": "星期四",
  "common.day_friday": "星期五",
  "common.day_saturday": "星期六",
  "common.reset": "重置",

  "sensory.visual.title": "视力筛查",
  "sensory.visual.description": "使用翻转 E 视标进行视力测试",
  "sensory.visual.instruction": "您会看到字母 E 指向不同方向，请选择它所指的方向。",
  "sensory.auditory.title": "听力筛查",
  "sensory.auditory.description": "通过噪声数字测试进行听力筛查",
  "sensory.auditory.instruction": "请听带有背景噪音的数字，并输入你听到的内容。",
  "sensory.olfactory.title": "嗅觉识别测试",
  "sensory.olfactory.description": "识别常见气味以评估嗅觉功能",

  "multimodal.title": "多模态认知智能",
  "multimodal.description": "结合 EEG、感觉标志物和血液生物标志物进行早期认知分期。",
  "multimodal.eeg_erp": "EEG / ERP",
  "multimodal.sensory": "感觉智能",
  "multimodal.blood": "血液生物标志物",
  "multimodal.guidance": "临床建议",
  "multimodal.probable_ad": "疑似阿尔茨海默病谱系",
  "multimodal.mixed_non_ad": "混合型 / 非阿尔茨海默病型",
  "multimodal.specialist_referral": "建议专科转诊",
  "multimodal.save": "保存多模态评估",
  "multimodal.user_id": "用户 ID",
  "multimodal.notes": "临床备注",
  "multimodal.risk": "综合风险等级",
  "multimodal.stage.normal": "正常认知",
  "multimodal.stage.at_risk": "认知下降风险",
  "multimodal.stage.early_mci": "早期轻度认知障碍",
  "multimodal.stage.intermediate_mci": "中期轻度认知障碍",
  "multimodal.stage.advanced_mci": "进展期轻度认知障碍",
  "multimodal.stage.mild_dementia": "轻度痴呆",
  "multimodal.stage.moderate_dementia": "中度痴呆",
  "multimodal.stage.severe_dementia": "重度痴呆",
}

const yueOverrides: TranslationMap = {
  "audio.instruction": "🔊 語音提示",
  "audio.instruction_playing": "🔊 播放中...",
  "audio.instruction_error": "語音提示暫時唔可用",
  "audio.error_playing": "播放語音時出錯，請再試一次。",
  "audio.not_supported": "呢個瀏覽器唔支援語音合成。",
  "audio.play": "播放語音",
  "audio.playing": "播放中...",

  "register.title": "用電話號碼註冊",
  "register.name": "姓名",
  "register.name.placeholder": "請輸入你嘅全名",
  "register.date_of_birth": "出生日期",
  "register.date_of_birth.placeholder": "請選擇出生日期",
  "register.date_of_birth.year": "年份",
  "register.date_of_birth.month": "月份",
  "register.date_of_birth.day": "日期",
  "register.gender": "性別",
  "register.gender.placeholder": "請選擇性別",
  "register.gender.male": "男",
  "register.gender.female": "女",
  "register.gender.other": "其他",
  "register.gender.prefer_not_to_say": "唔想透露",
  phone: "電話號碼",
  "register.submit": "註冊",
  "register.password": "密碼",
  "register.password.placeholder": "建立密碼",
  "register.confirm_password": "確認密碼",
  "register.confirm_password.placeholder": "再次輸入密碼",
  "register.error.password_short": "密碼至少要 8 個字元。",
  "register.error.password_mismatch": "兩次輸入嘅密碼唔一致。",
  "login.title": "用電話號碼登入",
  "login.submit": "登入",
  "login.admin": "管理員登入",
  "login.enter_phone": "輸入你已註冊嘅電話號碼以繼續",
  "login.password": "密碼",
  "login.password.placeholder": "輸入密碼",
  "login.error.invalid_credentials": "電話號碼或密碼唔正確。",
  "login.remember_phone": "喺呢部裝置記住電話號碼",
  "login.new_user": "新用戶？按此註冊",
  "login.already_account": "已經有帳戶？按此登入",
  "registration.description": "輸入你嘅電話號碼開始心理健康評估",

  "dashboard.title": "心理健康評估面板",
  "dashboard.name": "姓名",
  "dashboard.id": "編號",
  "dashboard.phone": "電話",
  "dashboard.resume": "繼續評估",
  "dashboard.retake": "重新測試",
  "dashboard.confirm_retake": "確認重測",
  "dashboard.logout": "登出",
  "dashboard.multimodal": "多模態認知智能",
  "dashboard.multimodal.description": "結合 EEG、感官標誌同血液生物標誌物做早期認知分期。",

  "moca.title": "蒙特利爾認知評估",
  "moca.visuospatial": "視覺空間能力 - 時鐘繪製",
  "moca.visuospatial.instruction": "請拖動時鐘指針，顯示 2 點 10 分。",
  "moca.executive": "執行功能 - 連線測試",
  "moca.executive.instruction": "請按交替次序連接圓圈：1-A-2-B-3-C-4-D。1、A 同 2 已經連好。",
  "moca.cube": "視覺空間能力 - 立方體臨摹",
  "moca.cube.instruction": "請觀察下面嘅立方體，然後照住畫出嚟。",
  "moca.naming": "物件命名",
  "moca.naming.instruction": "請睇每一張圖片，按正確嘅物件名稱。",
  "moca.memory": "記憶任務",
  "moca.memory.instruction": "系統會逐個顯示 {count} 個詞語，請記住佢哋，稍後做回憶。",
  "moca.attention": "注意力任務",
  "moca.attention.instruction": "請仔細睇圖片，數出你見到幾多隻狗。",
  "moca.language": "語言同抽象",
  "moca.language.instruction": "請留心聽並完成任務。",
  "moca.orientation": "定向力",
  "moca.orientation.instruction": "請回答以下關於目前日期同地點嘅問題。",

  "mmse.title": "簡易精神狀態檢查",
  "mmse.orientation": "定向力",
  "mmse.orientation.instruction": "請回答以下關於時間同地點嘅問題。",
  "mmse.orientation.time_questions": "時間問題（5分）",
  "mmse.orientation.place_questions": "地點問題（3分）",
  "mmse.registration": "記憶登記同回憶",
  "mmse.registration.instruction": "請先記住呢啲詞語，然後喺回憶階段輸入返出嚟。",
  "mmse.attention": "注意力同計算",
  "mmse.attention.instruction": "請由 100 開始，每次減 7，完成下面嘅計算題。",
  "mmse.naming": "物件命名",
  "mmse.naming.instruction": "請睇每一張圖片，按正確嘅項目名稱。",
  "mmse.repetition": "重複",
  "mmse.repetition.instruction": "請留心聽句子，並準確輸入你聽到嘅內容。",
  "mmse.writing": "書寫",
  "mmse.writing.instruction": "請按正確次序揀主語同謂語，組成一個簡單完整句子。",
  "mmse.writing.subject_1": "我",
  "mmse.writing.predicate_1": "食飯。",
  "mmse.writing.subject_2": "條魚",
  "mmse.writing.predicate_2": "識游水。",
  "mmse.writing.subject_3": "雞蛋",
  "mmse.writing.predicate_3": "係圓嘅。",
  "mmse.copying": "圖形抄寫",
  "mmse.copying.instruction": "請觀察下面嘅圖形，然後照住畫出嚟。",

  "memory.get_ready": "準備好，詞語會喺 {countdown} 秒後出現...",
  "memory.moca.words": ["面", "天鵝絨", "教堂", "雛菊", "紅色"],
  "memory.mmse.words": ["蘋果", "枱", "硬幣"],
  "memory.word_of": "第 {current} 個詞，共 {total} 個",
  "memory.preparing_recall": "準備進入回憶階段...",
  "memory.recall_instruction": "請以任何次序輸入你頭先見到嘅 {count} 個詞語。",
  "memory.submit_recall": "提交回憶",
  "common.submit": "提交",
  "common.skip_task": "略過任務",
  "audio.played_success": "✓ 語音已播放。依家請喺下面輸入你聽到嘅內容。",

  "question.date": "今日係幾號？",
  "question.month": "而家係幾月？",
  "question.year": "而家係邊一年？",
  "question.day": "今日係星期幾？",
  "question.country": "我哋而家喺邊個國家？",
  "question.season": "而家係咩季節？",
  "question.president": "現任國家主席係邊個？",
  "question.sea": "講出一個海嘅名稱：",
  "question.angles": "呢個圖形有幾多個角？",
  "question.subtract_series": "連續減法",
  "question.type_sentence": "請輸入你聽到嘅句子：",
  "question.write_sentence": "請組成句子：",
  "question.tap_correct_name": "請按正確嘅名稱。",
  "question.select_sentence_order": "請按正確次序揀主語同謂語。",
  "question.built_sentence": "已組成句子：",

  "question.animal_label": "動物 {index}：",
  "question.object_label": "物件 {index}：",

  "common.animal": "動物",
  "common.object": "物件",
  "common.television": "電視",
  "common.tiger": "老虎",
  "common.rhinoceros": "犀牛",
  "common.camel": "駱駝",
  "common.house": "屋",
  "common.bag": "袋",
  "common.word": "詞語",

  "results.title": "{assessmentType} 評估結果",
  "results.score_percentage": "{percentage}% 得分",
  "results.section_breakdown": "分項結果",
  "results.points": "{score} 分",
  "results.back_to_dashboard": "返回首頁",
  "results.interpretation.normal": "正常",
  "results.interpretation.mild_impairment": "輕度認知障礙",
  "results.interpretation.possible_decline": "可能出現認知下降",
  "results.interpretation.severe_impairment": "重度認知障礙",
  "results.moca.normal_range": "26-30：認知正常",
  "results.moca.mild_range": "18-25：輕度認知障礙",
  "results.moca.decline_range": "<18：可能出現認知下降",
  "results.mmse.normal_range": "21-28：認知正常",
  "results.mmse.mild_range": "15-20：輕度認知障礙",
  "results.mmse.severe_range": "<14：重度認知障礙",

  "admin.title": "管理員面板",
  "admin.login_title": "管理員登入",
  "admin.username": "用戶名稱",
  "admin.password": "密碼",
  "admin.login_button": "登入",
  "admin.registered_users": "已註冊用戶",
  "admin.assessments_in_progress": "進行中評估",

  "risk.level.low": "低風險",
  "risk.level.moderate": "中等風險",
  "risk.level.high": "高風險",
  "risk.level.very_high": "極高風險",
  "risk.profile_title": "認知障礙風險概況",
  "risk.view_profile": "查看風險概況",

  "theme.light": "淺色模式",
  "theme.dark": "深色模式",
  "theme.system": "系統",

  "common.loading": "載入中...",
  "common.assessment": "評估",
  "common.step": "第",
  "common.of": "共",
  "common.progress": "進度",
  "common.next": "下一步",
  "common.login": "登入",
  "common.logout": "登出",
  "common.resume": "繼續",
  "common.start": "開始評估",
  "common.view_results": "查看結果",
  "common.retake": "重新測試",
  "common.confirm_retake": "確認重測",
  "common.continue": "繼續",
  "common.president_name": "習近平",
  "common.china": "中國",
  "common.rice": "白飯",
  "common.noodles": "麵",
  "common.milk": "牛奶",
  "common.chicken": "雞肉",
  "common.fish": "魚",
  "common.egg": "雞蛋",
  "common.house": "房子",
  "common.bag": "包包",
  "common.tv": "電視",
  "common.spring": "春天",
  "common.summer": "夏天",
  "common.autumn": "秋天",
  "common.winter": "冬天",
  "common.month_1": "一月",
  "common.month_2": "二月",
  "common.month_3": "三月",
  "common.month_4": "四月",
  "common.month_5": "五月",
  "common.month_6": "六月",
  "common.month_7": "七月",
  "common.month_8": "八月",
  "common.month_9": "九月",
  "common.month_10": "十月",
  "common.month_11": "十一月",
  "common.month_12": "十二月",
  "common.day_sunday": "星期日",
  "common.day_monday": "星期一",
  "common.day_tuesday": "星期二",
  "common.day_wednesday": "星期三",
  "common.day_thursday": "星期四",
  "common.day_friday": "星期五",
  "common.day_saturday": "星期六",
  "common.reset": "重設",

  "sensory.visual.title": "視力篩查",
  "sensory.visual.description": "用翻轉 E 視標測試視力",
  "sensory.visual.instruction": "你會見到字母 E 指向唔同方向，請選擇佢指向嘅方向。",
  "sensory.auditory.title": "聽力篩查",
  "sensory.auditory.description": "透過噪音數字測試進行聽力篩查",
  "sensory.auditory.instruction": "請聽帶有背景噪音嘅數字，然後輸入你聽到嘅內容。",
  "sensory.olfactory.title": "嗅覺識別測試",
  "sensory.olfactory.description": "識別常見氣味以評估嗅覺功能",

  "multimodal.title": "多模態認知智能",
  "multimodal.description": "透過 EEG、感官標誌同血液生物標誌物做早期認知分期。",
  "multimodal.eeg_erp": "EEG / ERP",
  "multimodal.sensory": "感官智能",
  "multimodal.blood": "血液生物標誌物",
  "multimodal.guidance": "臨床建議",
  "multimodal.probable_ad": "疑似阿爾茨海默病譜系",
  "multimodal.mixed_non_ad": "混合型 / 非阿爾茨海默病型",
  "multimodal.specialist_referral": "建議轉介專科",
  "multimodal.save": "儲存多模態評估",
  "multimodal.user_id": "用戶 ID",
  "multimodal.notes": "臨床備註",
  "multimodal.risk": "綜合風險等級",
  "multimodal.stage.normal": "正常認知",
  "multimodal.stage.at_risk": "有認知下降風險",
  "multimodal.stage.early_mci": "早期輕度認知障礙",
  "multimodal.stage.intermediate_mci": "中期輕度認知障礙",
  "multimodal.stage.advanced_mci": "進展期輕度認知障礙",
  "multimodal.stage.mild_dementia": "輕度認知障礙症",
  "multimodal.stage.moderate_dementia": "中度認知障礙症",
  "multimodal.stage.severe_dementia": "重度認知障礙症",
}

const frOverrides: TranslationMap = {
  "audio.instruction": "🔊 Instruction audio",
  "audio.instruction_playing": "🔊 Lecture en cours...",
  "audio.instruction_error": "Instruction audio indisponible",
  "audio.error_playing": "Erreur lors de la lecture audio. Veuillez réessayer.",
  "audio.not_supported": "La synthèse vocale n'est pas prise en charge par ce navigateur.",
  "audio.play": "Lire l'audio",
  "audio.playing": "Lecture en cours...",

  "register.title": "Inscription par numéro de téléphone",
  "register.name": "Nom",
  "register.name.placeholder": "Entrez votre nom complet",
  "register.date_of_birth": "Date de naissance",
  "register.date_of_birth.placeholder": "Sélectionnez votre date de naissance",
  "register.date_of_birth.year": "Année",
  "register.date_of_birth.month": "Mois",
  "register.date_of_birth.day": "Jour",
  "register.gender": "Genre",
  "register.gender.placeholder": "Sélectionnez le genre",
  "register.gender.male": "Homme",
  "register.gender.female": "Femme",
  "register.gender.other": "Autre",
  "register.gender.prefer_not_to_say": "Préfère ne pas répondre",
  phone: "Numéro de téléphone",
  "register.submit": "S'inscrire",
  "register.password": "Mot de passe",
  "register.password.placeholder": "Créez un mot de passe",
  "register.confirm_password": "Confirmer le mot de passe",
  "register.confirm_password.placeholder": "Saisissez à nouveau votre mot de passe",
  "register.error.password_short": "Le mot de passe doit contenir au moins 8 caractères.",
  "register.error.password_mismatch": "Les mots de passe ne correspondent pas.",
  "login.title": "Connexion par numéro de téléphone",
  "login.submit": "Se connecter",
  "login.admin": "Connexion administrateur",
  "login.password": "Mot de passe",
  "login.password.placeholder": "Entrez votre mot de passe",
  "login.error.invalid_credentials": "Numéro de téléphone ou mot de passe invalide.",
  "login.remember_phone": "Mémoriser le numéro sur cet appareil",
  "login.new_user": "Nouvel utilisateur ? Inscrivez-vous ici",
  "login.already_account": "Vous avez déjà un compte ? Connectez-vous ici",
  "registration.description": "Entrez votre numéro de téléphone pour commencer l'évaluation de santé mentale",

  "dashboard.title": "Tableau de bord d'évaluation cognitive",
  "dashboard.name": "Nom",
  "dashboard.id": "ID",
  "dashboard.phone": "Téléphone",
  "dashboard.resume": "Reprendre l'évaluation",
  "dashboard.retake": "Repasser le test",
  "dashboard.confirm_retake": "Confirmer la reprise",
  "dashboard.logout": "Se déconnecter",
  "dashboard.multimodal": "Intelligence Cognitive Multimodale",
  "dashboard.multimodal.description":
    "EEG, marqueurs sensoriels et biomarqueurs sanguins pour la stadification cognitive précoce.",

  "moca.title": "Évaluation cognitive de Montréal",
  "moca.visuospatial": "Compétences visuospatiales - Horloge",
  "moca.visuospatial.instruction": "Déplacez les aiguilles de l’horloge pour indiquer 2 h 10.",
  "moca.executive": "Fonction exécutive - Trail Making",
  "moca.executive.instruction": "Reliez les cercles en alternant : 1-A-2-B-3-C-4-D. Les cercles 1, A et 2 sont déjà reliés.",
  "moca.cube": "Compétences visuospatiales - Copie du cube",
  "moca.cube.instruction": "Regardez le cube ci-dessous et recopiez le dessin.",
  "moca.naming": "Dénomination des objets",
  "moca.naming.instruction": "Regardez chaque image et touchez le bon nom de l’objet.",
  "moca.memory": "Tâches de mémoire",
  "moca.memory.instruction": "{count} mots vous seront montrés un par un. Mémorisez-les pour les rappeler ensuite.",
  "moca.attention": "Tâches d’attention",
  "moca.attention.instruction": "Regardez attentivement l’image et comptez le nombre de chiens que vous voyez.",
  "moca.language": "Langage et abstraction",
  "moca.language.instruction": "Écoutez attentivement et réalisez les tâches.",
  "moca.orientation": "Orientation",
  "moca.orientation.instruction": "Veuillez répondre aux questions suivantes sur la date actuelle et le lieu.",

  "mmse.title": "Mini-examen de l'état mental",
  "mmse.orientation": "Orientation",
  "mmse.orientation.instruction": "Veuillez répondre aux questions suivantes sur le temps et le lieu.",
  "mmse.orientation.time_questions": "Questions sur le temps (5 points)",
  "mmse.orientation.place_questions": "Questions sur le lieu (3 points)",
  "mmse.registration": "Enregistrement et rappel",
  "mmse.registration.instruction": "Mémorisez les mots puis saisissez-les pendant la phase de rappel.",
  "mmse.attention": "Attention et calcul",
  "mmse.attention.instruction": "Résolvez les soustractions en retirant 7 à chaque fois à partir de 100.",
  "mmse.naming": "Dénomination des objets",
  "mmse.naming.instruction": "Regardez chaque image et touchez le bon nom de l'élément.",
  "mmse.repetition": "Répétition",
  "mmse.repetition.instruction": "Écoutez attentivement la phrase et saisissez exactement ce que vous entendez.",
  "mmse.writing": "Écriture",
  "mmse.writing.instruction": "Touchez le sujet et le prédicat dans le bon ordre pour former une phrase simple.",
  "mmse.writing.subject_1": "Je",
  "mmse.writing.predicate_1": "mange du riz.",
  "mmse.writing.subject_2": "Le poisson",
  "mmse.writing.predicate_2": "peut nager.",
  "mmse.writing.subject_3": "L'œuf",
  "mmse.writing.predicate_3": "est rond.",
  "mmse.copying": "Copie de figure",
  "mmse.copying.instruction": "Regardez la figure ci-dessous et recopiez-la.",

  "memory.get_ready": "Préparez-vous. Les mots apparaîtront dans {countdown} secondes...",
  "memory.moca.words": ["Visage", "Velours", "Église", "Marguerite", "Rouge"],
  "memory.mmse.words": ["Pomme", "Table", "Pièce"],
  "memory.word_of": "Mot {current} sur {total}",
  "memory.preparing_recall": "Préparation de la phase de rappel...",
  "memory.recall_instruction": "Veuillez saisir les {count} mots que vous venez de voir, dans n’importe quel ordre.",
  "memory.submit_recall": "Soumettre le rappel",
  "common.submit": "Soumettre",
  "common.skip_task": "Ignorer la tâche",
  "audio.played_success": "✓ Audio lu. Saisissez maintenant ce que vous avez entendu ci-dessous.",
  "question.angles": "Combien d’angles cette figure a-t-elle ?",
  "question.subtract_series": "Soustraction en série",
  "question.type_sentence": "Saisissez la phrase entendue :",
  "question.write_sentence": "Construisez la phrase :",
  "question.tap_correct_name": "Touchez le bon nom.",
  "question.select_sentence_order": "Touchez le sujet et le prédicat dans le bon ordre.",
  "question.built_sentence": "Phrase construite :",

  "question.animal_label": "Animal {index} :",
  "question.object_label": "Objet {index} :",

  "common.animal": "Animal",
  "common.object": "Objet",
  "common.television": "télévision",
  "common.tiger": "tigre",
  "common.rhinoceros": "rhinocéros",
  "common.camel": "chameau",
  "common.house": "maison",
  "common.bag": "sac",
  "common.word": "Mot",

  "results.title": "Résultats de l'évaluation {assessmentType}",
  "results.score_percentage": "Score de {percentage}%",
  "results.section_breakdown": "Répartition par section",
  "results.points": "{score} points",
  "results.back_to_dashboard": "Retour au tableau de bord",
  "results.interpretation.normal": "Normal",
  "results.interpretation.mild_impairment": "Déficience cognitive légère",
  "results.interpretation.possible_decline": "Déclin cognitif possible",
  "results.interpretation.severe_impairment": "Déficience cognitive sévère",

  "admin.title": "Tableau de bord administrateur",
  "admin.login_title": "Connexion administrateur",
  "admin.username": "Nom d'utilisateur",
  "admin.password": "Mot de passe",
  "admin.login_button": "Se connecter",
  "admin.registered_users": "Utilisateurs inscrits",
  "admin.assessments_in_progress": "Évaluations en cours",

  "risk.level.low": "Risque faible",
  "risk.level.moderate": "Risque modéré",
  "risk.level.high": "Risque élevé",
  "risk.level.very_high": "Risque très élevé",
  "risk.profile_title": "Profil de risque de démence",
  "risk.view_profile": "Voir le profil de risque",

  "theme.light": "Mode clair",
  "theme.dark": "Mode sombre",
  "theme.system": "Système",

  "common.loading": "Chargement...",
  "common.next": "Suivant",
  "common.login": "Se connecter",
  "common.logout": "Se déconnecter",
  "common.resume": "Reprendre",
  "common.start": "Commencer l'évaluation",
  "common.view_results": "Voir les résultats",
  "common.retake": "Repasser le test",
  "common.confirm_retake": "Confirmer la reprise",
  "common.continue": "Continuer",
  "common.rice": "riz",
  "common.noodles": "nouilles",
  "common.milk": "lait",
  "common.chicken": "poulet",
  "common.fish": "poisson",
  "common.egg": "oeuf",
  "common.house": "maison",
  "common.bag": "sac",
  "common.tv": "télévision",
  "common.spring": "printemps",
  "common.summer": "été",
  "common.autumn": "automne",
  "common.winter": "hiver",
  "common.month_1": "janvier",
  "common.month_2": "février",
  "common.month_3": "mars",
  "common.month_4": "avril",
  "common.month_5": "mai",
  "common.month_6": "juin",
  "common.month_7": "juillet",
  "common.month_8": "août",
  "common.month_9": "septembre",
  "common.month_10": "octobre",
  "common.month_11": "novembre",
  "common.month_12": "décembre",
  "common.day_sunday": "dimanche",
  "common.day_monday": "lundi",
  "common.day_tuesday": "mardi",
  "common.day_wednesday": "mercredi",
  "common.day_thursday": "jeudi",
  "common.day_friday": "vendredi",
  "common.day_saturday": "samedi",
  "common.reset": "Réinitialiser",

  "sensory.visual.title": "Dépistage visuel",
  "sensory.visual.description": "Évaluez l'acuité visuelle avec le test du E directionnel",
  "sensory.visual.instruction": "Vous verrez la lettre E orientée dans différentes directions. Sélectionnez la direction indiquée.",
  "sensory.auditory.title": "Dépistage auditif",
  "sensory.auditory.description": "Évaluez l'audition avec un test de chiffres dans le bruit",
  "sensory.auditory.instruction": "Écoutez les chiffres diffusés avec un bruit de fond et saisissez ce que vous entendez.",
  "sensory.olfactory.title": "Test d'identification des odeurs",
  "sensory.olfactory.description": "Identifiez des odeurs courantes pour évaluer la fonction olfactive",

  "multimodal.title": "Intelligence Cognitive Multimodale",
  "multimodal.description":
    "EEG, marqueurs sensoriels et biomarqueurs sanguins pour la stadification cognitive précoce.",
  "multimodal.eeg_erp": "EEG / ERP",
  "multimodal.sensory": "Intelligence sensorielle",
  "multimodal.blood": "Biomarqueurs sanguins",
  "multimodal.guidance": "Orientation clinique",
  "multimodal.probable_ad": "Profil probable de maladie d’Alzheimer",
  "multimodal.mixed_non_ad": "Mixte / non-Alzheimer",
  "multimodal.specialist_referral": "Orientation spécialisée",
  "multimodal.save": "Enregistrer l’évaluation multimodale",
  "multimodal.user_id": "ID utilisateur",
  "multimodal.notes": "Notes cliniques",
  "multimodal.risk": "Niveau de risque composite",
  "multimodal.stage.normal": "Cognition normale",
  "multimodal.stage.at_risk": "Déclin cognitif à risque",
  "multimodal.stage.early_mci": "TCL précoce",
  "multimodal.stage.intermediate_mci": "TCL intermédiaire",
  "multimodal.stage.advanced_mci": "TCL avancé",
  "multimodal.stage.mild_dementia": "Démence légère",
  "multimodal.stage.moderate_dementia": "Démence modérée",
  "multimodal.stage.severe_dementia": "Démence sévère",
}

const translations: Record<Language, TranslationMap> = {
  en: englishTranslations,
  zh: { ...englishTranslations, ...zhOverrides },
  yue: { ...englishTranslations, ...yueOverrides },
  fr: { ...englishTranslations, ...frOverrides },
}

const translationOverrides: Partial<Record<Language, TranslationMap>> = {
  zh: zhOverrides,
  yue: yueOverrides,
  fr: frOverrides,
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

function interpolate(text: string, options?: InterpolationValues) {
  if (!options) return text
  return Object.entries(options).reduce((acc, [key, value]) => {
    return acc.replaceAll(`{${key}}`, String(value))
  }, text)
}

function safelyReadStoredLanguage(): Language {
  if (typeof window === "undefined") return "en"
  const saved = window.localStorage.getItem("language")
  if (saved === "en" || saved === "zh" || saved === "yue" || saved === "fr") return saved
  return "en"
}

function scheduleAfterRender(task: () => void) {
  if (typeof window === "undefined") {
    return
  }

  window.setTimeout(task, 0)
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en")
  const [voicesReady, setVoicesReady] = useState(false)
  const [runtimeTranslations, setRuntimeTranslations] = useState<Partial<Record<Language, Record<string, string>>>>({})
  const pendingTranslationsRef = useRef(new Set<string>())

  useEffect(() => {
    setLanguageState(safelyReadStoredLanguage())
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    window.localStorage.setItem("language", language)
  }, [language])

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return

    const loadVoices = () => {
      window.speechSynthesis.getVoices()
      setVoicesReady(true)
    }

    loadVoices()
    window.speechSynthesis.onvoiceschanged = loadVoices

    return () => {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.onvoiceschanged = null
      }
    }
  }, [])

  const requestRuntimeTranslation = useCallback((lang: Language, sourceText: string, cacheKey: string) => {
    if (lang === "en" || !sourceText.trim() || typeof window === "undefined") {
      return
    }

    const pendingKey = `${lang}:${cacheKey}`
    if (pendingTranslationsRef.current.has(pendingKey)) {
      return
    }

    pendingTranslationsRef.current.add(pendingKey)

    void fetch("/api/translate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: sourceText,
        targetLanguage: lang,
      }),
    })
      .then(async (response) => {
        if (!response.ok) {
          return null
        }

        const payload = await response.json()
        return typeof payload.translatedText === "string" ? payload.translatedText.trim() : null
      })
      .then((translatedText) => {
        if (!translatedText || translatedText === sourceText) {
          return
        }

        setRuntimeTranslations((previous) => ({
          ...previous,
          [lang]: {
            ...(previous[lang] ?? {}),
            [cacheKey]: translatedText,
          },
        }))
      })
      .catch(() => {
        // Ignore runtime localization failures and fall back to the source text.
      })
      .finally(() => {
        pendingTranslationsRef.current.delete(pendingKey)
      })
  }, [])

  const getLanguageName = (lang: Language) => {
    return (
      {
        en: "English",
        zh: "中文",
        yue: "廣東話",
        fr: "Français",
      }[lang] || "English"
    )
  }

  const getSpeechLanguage = (lang: Language) => {
    return (
      {
        en: "en-US",
        zh: "zh-CN",
        yue: "zh-HK",
        fr: "fr-FR",
      }[lang] || "en-US"
    )
  }

  const getSpeechSettings = (lang: Language = language): SpeechSettings => {
    switch (lang) {
      case "zh":
        return { lang: "zh-CN", rate: 0.92, pitch: 1, volume: 1 }
      case "yue":
        return { lang: "zh-HK", rate: 0.88, pitch: 1, volume: 1 }
      case "fr":
        return { lang: "fr-FR", rate: 0.95, pitch: 1, volume: 1 }
      default:
        return { lang: "en-US", rate: 0.96, pitch: 1, volume: 1 }
    }
  }

  const getBestVoice = (lang: Language = language): SpeechSynthesisVoice | null => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return null

    const voices = window.speechSynthesis.getVoices()
    if (!voices.length && !voicesReady) return null

    const preferred = {
      en: ["en-US", "en-GB"],
      zh: ["zh-CN", "cmn-CN", "zh-SG", "zh"],
      yue: ["zh-HK", "yue-HK", "zh-TW", "zh-Hant-HK", "yue"],
      fr: ["fr-FR", "fr-CA", "fr"],
    }[lang]

    for (const locale of preferred) {
      const exact = voices.find((v) => v.lang?.toLowerCase() === locale.toLowerCase())
      if (exact) return exact
    }

    for (const locale of preferred) {
      const partial = voices.find((v) => v.lang?.toLowerCase().startsWith(locale.toLowerCase()))
      if (partial) return partial
    }

    if (lang === "yue") {
      const byName = voices.find((v) => {
        const name = v.name.toLowerCase()
        return name.includes("cantonese") || name.includes("hong kong") || name.includes("hk")
      })
      if (byName) return byName
    }

    return null
  }

  const localizeText = useCallback(
    (englishText: string, overrides?: Partial<Record<Language, string>>) => {
      const directOverride = overrides?.[language]
      if (directOverride) {
        return directOverride
      }

      if (language === "en") {
        return englishText
      }

      const cacheKey = `text:${englishText}`
      const cachedText = runtimeTranslations[language]?.[cacheKey]

      if (cachedText) {
        return cachedText
      }

      scheduleAfterRender(() => requestRuntimeTranslation(language, englishText, cacheKey))
      return englishText
    },
    [language, requestRuntimeTranslation, runtimeTranslations],
  )

  const t = useMemo(
    () => (key: string, options?: InterpolationValues) => {
      const overrideValue = translationOverrides[language]?.[key]
      const fallback = translations.en[key]
      const runtimeValue = runtimeTranslations[language]?.[`key:${key}`]

      if (language !== "en" && overrideValue === undefined && runtimeValue === undefined && typeof fallback === "string") {
        scheduleAfterRender(() => requestRuntimeTranslation(language, fallback, `key:${key}`))
      }

      const value = overrideValue ?? runtimeValue ?? fallback ?? key

      if (Array.isArray(value)) {
        return value.join(", ")
      }

      return interpolate(String(value), options)
    },
    [language, requestRuntimeTranslation, runtimeTranslations],
  )

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
  }

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        localizeText,
        getLanguageName,
        getSpeechLanguage,
        getSpeechSettings,
        getBestVoice,
      }}
    >
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}