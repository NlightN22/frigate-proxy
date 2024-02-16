export interface FrigateConfig {
    birdseye: Birdseye
    cameras: any
    database: Database
    detect: Detect
    detectors: Detectors
    environment_vars: EnvironmentVars
    ffmpeg: Ffmpeg
    go2rtc: Go2rtc
    live: Live
    logger: Logger
    model: Model
    motion: any
    mqtt: Mqtt
    objects: Objects
    plus: Plus
    record: Record
    rtmp: Rtmp
    snapshots: Snapshots
    telemetry: Telemetry
    timestamp_style: TimestampStyle
    ui: Ui
  }

  export interface Ui {
    date_style: string
    live_mode: string
    strftime_fmt: any
    time_format: string
    time_style: string
    timezone: any
    use_experimental: boolean
  }

  export interface Color {
    blue: number
    green: number
    red: number
  }

  export interface TimestampStyle {
    color: Color
    effect: any
    format: string
    position: string
    thickness: number
  }

  export interface Telemetry {
    version_check: boolean
  }

  export interface Rtmp {
    enabled: boolean
  }
  

  export interface Snapshots {
    bounding_box: boolean
    clean_copy: boolean
    crop: boolean
    enabled: boolean
    height: any
    quality: number
    required_zones: any[]
    retain: RetainSnapshots
    timestamp: boolean
  }

  export interface RetainSnapshots {
    default: number
    mode: string
    objects: ObjectsSnapshots
  }

  export interface ObjectsSnapshots {}

  export interface Record {
    enabled: boolean
    events: Events
    expire_interval: number
    retain: RetainRecord
    retain_days: any
  }

  export interface RetainRecord {
    days: number
    mode: string
  }

  export interface Events {
    objects: any
    post_capture: number
    pre_capture: number
    required_zones: any[]
    retain: RetainEvents
  }

  export interface RetainEvents {
    default: number
    mode: string
    objects: ObjectsEvents
  }

  export interface ObjectsEvents {}

  export interface Plus {
    enabled: boolean
  }

  export interface Objects {
    filters: any
    mask: string
    track: string[]
  }

  export interface Model {
    height: number
    input_pixel_format: string
    input_tensor: string
    labelmap: Labelmap
    labelmap_path: string
    model_type: string
    path: any
    width: number
  }

  export interface Labelmap {}

  export interface Live {
    height: number
    quality: number
    stream_name: string
  }

  export interface Logger {
    default: string
    logs: Logs
  }

  export interface Logs {
    "frigate.record": string
  }

  export interface Go2rtc {}

  export interface Ffmpeg {
    global_args: string[]
    hwaccel_args: string
    input_args: string
    output_args: OutputArgs
  }

  export interface OutputArgs {
    detect: string[]
    record: string
    rtmp: string
  }

  export interface Database {
    path: string
  }

  export interface Detect {
    enabled: boolean
    fps: number
    height: number
    max_disappeared: any
    stationary: Stationary
    width: number
  }

  export interface Stationary {
    interval: number
    max_frames: MaxFrames
    threshold: any
  }

  export interface MaxFrames {
    default: any
    objects: Objects
  }

  export interface Objects {}

  export interface Birdseye {
    enabled: boolean
    height: number
    mode: string
    quality: number
    restream: boolean
    width: number
  }

  export interface Detectors {
    ov: Ov
  }

  export interface Ov {
    device: string
    model: ModelOv
    type: string
  }

  export interface ModelOv {
    height: number
    input_pixel_format: string
    input_tensor: string
    labelmap: Labelmap
    labelmap_path: string
    model_type: string
    path: string
    width: number
  }

  export interface Labelmap {}

  export interface EnvironmentVars {}

  export interface Birdseye2 {
    enabled: boolean
    mode: string
  }

  export interface Mqtt {
    client_id: string
    enabled: boolean
    host: string
    password: any
    port: number
    stats_interval: number
    tls_ca_certs: any
    tls_client_cert: any
    tls_client_key: any
    tls_insecure: any
    topic_prefix: string
    user: any
  }