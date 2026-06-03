# Patent Figure Package

## FIG. 1: Overall system architecture and deployment boundaries
```mermaid
flowchart LR
  subgraph Patient[Patient application]
    Login[Login / Register]
    Dashboard[Dashboard]
    Cognitive[Cognitive assessments\n(MOCA / MMSE)]
    Sensory[Sensory assessments\n(visual / auditory / olfactory / TCM)]
    Results[Results and risk profile]
  end

  subgraph Cloud[Cloud backend and database]
    Auth[Session / auth]
    DB[(Assessments and progress data)]
    Rules[Risk classification service]
  end

  subgraph Admin[Admin / clinician console]
    AdminPanel[Admin panel]
    Analytics[Trend views and review tools]
  end

  subgraph Optional[Optional multimodal extension]
    Multimodal[/multimodal preview surface/]
    EEG[EEG / ERP input]
    Biomarker[Biomarker input]
    Fusion[Multimodal fusion engine]
  end

  Login --> Dashboard
  Dashboard --> Cognitive
  Dashboard --> Sensory
  Cognitive --> Results
  Sensory --> Results
  Results --> Rules
  Rules --> DB
  DB --> AdminPanel
  AdminPanel --> Analytics
  Multimodal --> EEG
  Multimodal --> Biomarker
  EEG --> Fusion
  Biomarker --> Fusion
```

## FIG. 2: Patient-side application state machine and workflow
```mermaid
stateDiagram-v2
  [*] --> Login
  Login --> Dashboard: authenticated
  Dashboard --> MOCA: select cognitive test
  Dashboard --> MMSE: select cognitive test
  Dashboard --> Visual: select sensory test
  Dashboard --> Auditory: select sensory test
  Dashboard --> Olfactory: select sensory test
  Dashboard --> TCM: select sensory test
  MOCA --> Results: all steps complete
  MMSE --> Results: all steps complete
  Visual --> Dashboard: submit
  Auditory --> Dashboard: submit
  Olfactory --> Dashboard: submit
  TCM --> Dashboard: submit
  Results --> RiskProfile: view risk profile
  RiskProfile --> Dashboard: return
```

## FIG. 3: Cognitive assessment engine, score normalization, and persistence flow
```mermaid
flowchart LR
  Start[Select MOCA or MMSE] --> Steps[Load step array and section keys]
  Steps --> Input[Capture raw score per step]
  Input --> Clamp[Clamp section score to valid bounds]
  Clamp --> Aggregate[Build section scores and total score]
  Aggregate --> Save[Save progress and assessment row]
  Save --> Classify[Run risk classification]
  Classify --> Update[Update saved assessment with risk data]
  Update --> Results[Show results screen]
```

## FIG. 4: Sensory module workflow, including olfactory protocol branching
```mermaid
flowchart TB
  Dashboard[Dashboard sensory selection] --> Visual[Visual module]
  Dashboard --> Auditory[Auditory module]
  Dashboard --> TCM[TCM module]
  Dashboard --> Olfactory[Olfactory module]

  Olfactory --> Protocol{Protocol variant?}
  Protocol -->|Item set A| VersionA[Olfactory item set A]
  Protocol -->|Item set B| VersionB[Olfactory item set B]
  Protocol -->|Item set C| VersionC[Olfactory item set C]

  Visual --> Output[Structured sensory output]
  Auditory --> Output
  TCM --> Output
  VersionA --> Output
  VersionB --> Output
  VersionC --> Output
```

## FIG. 5: Risk scoring and recommendation pipeline
```mermaid
flowchart LR
  Assessment[Completed assessment score] --> Input[Build risk input payload]
  Input --> Classify[Risk classification service]
  Classify --> RiskClass[Risk class]
  Classify --> Recommendation[Recommendation text]
  Classify --> Referral[Referral needed flag]
  RiskClass --> Display[Risk profile display]
  Recommendation --> Display
  Referral --> Display
```

## FIG. 6: Multilingual authentication and session persistence flow
```mermaid
flowchart TB
  Language[Language selector] --> I18N[Translation context]
  I18N --> Login[Login / register screen]
  Login --> UserCtx[User context]
  UserCtx --> Restore[Restore cached profile if present]
  UserCtx --> Save[Save progress]
  UserCtx --> Clear[Clear progress]
  Middleware[Session middleware] --> UserCtx
  Restore --> Dashboard[Dashboard]
  Save --> Dashboard
  Clear --> Login
```

## FIG. 7: Admin dashboard and analytics console workflow
```mermaid
flowchart LR
  AdminLogin[Admin login] --> Panel[Admin panel]
  Panel --> Users[User records]
  Panel --> Assessments[Assessment records]
  Panel --> Files[Uploaded files]
  Panel --> Trends[Trend charts]
  Panel --> Sensory[Sensory data review]
  Panel --> TCM[TCM data review]
  Assessments --> Trends
  Files --> Trends
  Sensory --> Trends
  TCM --> Trends
```

## FIG. 8: Optional multimodal extension for EEG and biomarker inputs
```mermaid
flowchart TB
  Multimodal[/multimodal preview route/] --> EEG[EEG / ERP panel]
  Multimodal --> Biomarker[Blood biomarker panel]
  Multimodal --> SensoryIntelligence[Sensory intelligence panel]
  EEG --> Stage[Staging and calculations]
  Biomarker --> Stage
  SensoryIntelligence --> Stage
  Stage --> Fusion[Fusion engine]
  Fusion --> Draft[Draft output / local fallback]
```