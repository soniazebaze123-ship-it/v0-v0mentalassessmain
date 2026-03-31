"use client"

import type React from "react"
import { createContext, useContext, useEffect, useMemo, useState } from "react"

type Language = "en" | "zh" | "yue" | "fr"

type TranslationMap = Record<string, string | string[]>

interface SpeechSettings {
  lang: string
  rate: number
  pitch: number
  volume: number
}

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, options?: Record<string, any>) => string
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
  "login.title": "Login with Phone Number",
  "login.submit": "Login",
  "login.error.notfound": "Phone number not found",
  "login.admin": "Admin Login",
  "login.enter_phone": "Enter your registered phone number to continue",
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
  "moca.naming": "Naming Animals",
  "moca.naming.instruction": "Look at each image and type the name of the animal you see.",
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
"mmse.registration": "Registration & Recall",
"mmse.attention": "Attention & Calculation",
"mmse.naming": "Naming Objects",
"mmse.naming.instruction": "Look at each image and type the name of the object you see.",
"mmse.repetition": "Repetition",

// ✅ FIXED (complete sentence)
"mmse.repetition.instruction": "Listen carefully to the sentence and type exactly what you hear.",

// ✅ ADD KEYS HERE (separate, clean)
"mmse.repetition.target.en": "He drew a picture",
"mmse.repetition.target.zh": "他画了一幅画",
"mmse.repetition.target.yue": "佢畫咗一幅畫",
"mmse.repetition.target.fr": "Il a dessiné une image",

"mmse.writing": "Writing",
"mmse.writing.instruction":
  "Please write a complete sentence. The sentence should have a subject and a verb and make sense.",
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
  "question.subtract": "What is 10 minus 7?",
  "question.add": "What should we add to 4 to get 7?",
  "question.your_answer": "Your answer:",
  "question.type_sentence": "Type the sentence you heard:",
  "question.write_sentence": "Write your sentence here:",
  "question.animal_label": "Animal {index}:",
  "question.object_label": "Object {index}:",

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

  "register.title": "手机号注册",
  "register.name": "姓名",
  "register.name.placeholder": "请输入您的姓名",
  "register.date_of_birth": "出生日期",
  "register.gender": "性别",
  "register.gender.placeholder": "请选择性别",
  "register.gender.male": "男",
  "register.gender.female": "女",
  "register.gender.other": "其他",
  "register.gender.prefer_not_to_say": "不愿透露",
  phone: "手机号",
  "register.submit": "注册",
  "login.title": "手机号登录",
  "login.submit": "登录",
  "login.admin": "管理员登录",
  "login.enter_phone": "请输入已注册的手机号继续",
  "registration.description": "请输入手机号以开始心理健康评估",

  "dashboard.title": "心理健康评估面板",
  "dashboard.resume": "继续评估",
  "dashboard.retake": "重新测试",
  "dashboard.confirm_retake": "确认重测",
  "dashboard.logout": "退出登录",
  "dashboard.multimodal": "多模态认知智能",
  "dashboard.multimodal.description": "结合 EEG、感觉标志物与血液生物标志物进行早期认知分期。",

  "moca.title": "蒙特利尔认知评估",
  "moca.visuospatial": "视空间能力 - 时钟绘制",
  "moca.executive": "执行功能 - 连线测试",
  "moca.naming": "动物命名",
  "moca.memory": "记忆任务",
  "moca.attention": "注意力任务",
  "moca.language": "语言与抽象",
  "moca.orientation": "定向力",

  "mmse.title": "简易精神状态检查",
  "mmse.orientation": "定向力",
  "mmse.registration": "记忆登记与回忆",
  "mmse.attention": "注意力与计算",
  "mmse.naming": "物体命名",
  "mmse.repetition": "复述",
  "mmse.writing": "书写",
  "mmse.copying": "图形复制",

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

  "sensory.visual.title": "视力筛查",
  "sensory.visual.description": "使用翻转 E 视标进行视力测试",
  "sensory.auditory.title": "听力筛查",
  "sensory.auditory.description": "通过噪声数字测试进行听力筛查",
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

  "register.title": "用電話號碼註冊",
  "register.name": "姓名",
  "register.name.placeholder": "請輸入你嘅全名",
  "register.date_of_birth": "出生日期",
  "register.gender": "性別",
  "register.gender.placeholder": "請選擇性別",
  "register.gender.male": "男",
  "register.gender.female": "女",
  "register.gender.other": "其他",
  "register.gender.prefer_not_to_say": "唔想透露",
  phone: "電話號碼",
  "register.submit": "註冊",
  "login.title": "用電話號碼登入",
  "login.submit": "登入",
  "login.admin": "管理員登入",
  "login.enter_phone": "輸入你已註冊嘅電話號碼以繼續",
  "registration.description": "輸入你嘅電話號碼開始心理健康評估",

  "dashboard.title": "心理健康評估面板",
  "dashboard.resume": "繼續評估",
  "dashboard.retake": "重新測試",
  "dashboard.confirm_retake": "確認重測",
  "dashboard.logout": "登出",
  "dashboard.multimodal": "多模態認知智能",
  "dashboard.multimodal.description": "結合 EEG、感官標誌同血液生物標誌物做早期認知分期。",

  "moca.title": "蒙特利爾認知評估",
  "moca.visuospatial": "視覺空間能力 - 時鐘繪製",
  "moca.executive": "執行功能 - 連線測試",
  "moca.naming": "動物命名",
  "moca.memory": "記憶任務",
  "moca.attention": "注意力任務",
  "moca.language": "語言同抽象",
  "moca.orientation": "定向力",

  "mmse.title": "簡易精神狀態檢查",
  "mmse.orientation": "定向力",
  "mmse.registration": "記憶登記同回憶",
  "mmse.attention": "注意力同計算",
  "mmse.naming": "物件命名",
  "mmse.repetition": "重複",
  "mmse.writing": "書寫",
  "mmse.copying": "圖形抄寫",

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

  "sensory.visual.title": "視力篩查",
  "sensory.visual.description": "用翻轉 E 視標測試視力",
  "sensory.auditory.title": "聽力篩查",
  "sensory.auditory.description": "透過噪音數字測試進行聽力篩查",
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

  "register.title": "Inscription par numéro de téléphone",
  "register.name": "Nom",
  "register.name.placeholder": "Entrez votre nom complet",
  "register.date_of_birth": "Date de naissance",
  "register.gender": "Genre",
  "register.gender.placeholder": "Sélectionnez le genre",
  "register.gender.male": "Homme",
  "register.gender.female": "Femme",
  "register.gender.other": "Autre",
  "register.gender.prefer_not_to_say": "Préfère ne pas répondre",
  phone: "Numéro de téléphone",
  "register.submit": "S'inscrire",
  "login.title": "Connexion par numéro de téléphone",
  "login.submit": "Se connecter",
  "login.admin": "Connexion administrateur",
  "registration.description": "Entrez votre numéro de téléphone pour commencer l'évaluation de santé mentale",

  "dashboard.title": "Tableau de bord d'évaluation cognitive",
  "dashboard.resume": "Reprendre l'évaluation",
  "dashboard.retake": "Repasser le test",
  "dashboard.confirm_retake": "Confirmer la reprise",
  "dashboard.logout": "Se déconnecter",
  "dashboard.multimodal": "Intelligence Cognitive Multimodale",
  "dashboard.multimodal.description":
    "EEG, marqueurs sensoriels et biomarqueurs sanguins pour la stadification cognitive précoce.",

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
  "common.login": "Se connecter",
  "common.logout": "Se déconnecter",
  "common.resume": "Reprendre",
  "common.start": "Commencer l'évaluation",
  "common.view_results": "Voir les résultats",
  "common.retake": "Repasser le test",
  "common.confirm_retake": "Confirmer la reprise",
  "common.continue": "Continuer",

  "sensory.visual.title": "Dépistage visuel",
  "sensory.visual.description": "Évaluez l'acuité visuelle avec le test du E directionnel",
  "sensory.auditory.title": "Dépistage auditif",
  "sensory.auditory.description": "Évaluez l'audition avec un test de chiffres dans le bruit",
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

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

function interpolate(text: string, options?: Record<string, any>) {
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

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en")
  const [voicesReady, setVoicesReady] = useState(false)

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

    return voices[0] || null
  }

  const t = useMemo(
    () => (key: string, options?: Record<string, any>) => {
      const current = translations[language]?.[key]
      const fallback = translations.en[key]

      const value = current ?? fallback ?? key

      if (Array.isArray(value)) {
        return value.join(", ")
      }

      return interpolate(String(value), options)
    },
    [language],
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
