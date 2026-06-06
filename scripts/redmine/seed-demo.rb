# frozen_string_literal: true

User.current = User.find_by(login: "admin") || User.first

Setting.rest_api_enabled = "1"

new_status = IssueStatus.find_or_create_by!(name: "New") do |status|
  status.position = 1
  status.default_done_ratio = 0
end

in_progress_status = IssueStatus.find_or_create_by!(name: "In Progress") do |status|
  status.position = 2
  status.default_done_ratio = 40
end

feedback_status = IssueStatus.find_or_create_by!(name: "Feedback") do |status|
  status.position = 3
  status.default_done_ratio = 20
end

resolved_status = IssueStatus.find_or_create_by!(name: "Resolved") do |status|
  status.position = 4
  status.default_done_ratio = 90
end

closed_status = IssueStatus.find_or_create_by!(name: "Closed") do |status|
  status.position = 5
  status.is_closed = true
  status.default_done_ratio = 100
end
closed_status.update!(is_closed: true, default_done_ratio: 100)

low_priority = IssuePriority.find_or_create_by!(name: "Low") do |priority|
  priority.position = 1
  priority.active = true
end

normal_priority = IssuePriority.find_or_create_by!(name: "Normal") do |priority|
  priority.position = 2
  priority.active = true
  priority.is_default = true
end
normal_priority.update!(is_default: true)

high_priority = IssuePriority.find_or_create_by!(name: "High") do |priority|
  priority.position = 3
  priority.active = true
end

urgent_priority = IssuePriority.find_or_create_by!(name: "Urgent") do |priority|
  priority.position = 4
  priority.active = true
end

feature_tracker = Tracker.find_or_create_by!(name: "Feature") do |tracker|
  tracker.default_status = new_status
  tracker.position = 1
end

task_tracker = Tracker.find_or_create_by!(name: "Task") do |tracker|
  tracker.default_status = new_status
  tracker.position = 2
end

bug_tracker = Tracker.find_or_create_by!(name: "Bug") do |tracker|
  tracker.default_status = new_status
  tracker.position = 3
end

project = Project.find_or_initialize_by(identifier: "airedmine-demo")
project.name = "AIRedmine Demo"
project.description = "AI agent driven Redmine project experience demo."
project.is_public = true
project.status = Project::STATUS_ACTIVE
project.trackers = [feature_tracker, task_tracker, bug_tracker]
project.enabled_module_names = %w[issue_tracking wiki time_tracking news]
project.save!

admin = User.current

issues = [
  {
    subject: "PM判断待ち: リリース対象issueの優先順位を確定する",
    tracker: task_tracker,
    status: feedback_status,
    priority: urgent_priority,
    description: "次回リリースに含めるissueをPMが確定する。AIエージェントは候補と根拠を提示する。",
    updated_on: 8.days.ago
  },
  {
    subject: "開発者向け: 今日取り組むissue候補を提示する",
    tracker: feature_tracker,
    status: in_progress_status,
    priority: high_priority,
    description: "担当issue、優先度、更新状況をもとに、今日の作業候補と確認点を提示する。",
    updated_on: 2.days.ago
  },
  {
    subject: "仕様確認待ち: Redmine更新前の承認境界を決める",
    tracker: task_tracker,
    status: feedback_status,
    priority: high_priority,
    description: "AIがRedmineを更新する前に、人間が確認すべき差分、理由、影響範囲を整理する。",
    updated_on: 6.days.ago
  },
  {
    subject: "停滞リスク: 知識ベース連携の対象範囲を絞る",
    tracker: feature_tracker,
    status: new_status,
    priority: normal_priority,
    description: "docs、Redmine wiki、PR、CI結果のどこまでを最初の知識ベース対象にするか決める。",
    updated_on: 12.days.ago
  },
  {
    subject: "不具合: APIキー未設定時の案内文を改善する",
    tracker: bug_tracker,
    status: new_status,
    priority: normal_priority,
    description: "モック表示中であることと、実Redmine接続に必要な設定をより分かりやすくする。",
    updated_on: 1.day.ago
  },
  {
    subject: "クローズ候補: Docker Compose接続手順をREADMEに反映する",
    tracker: task_tracker,
    status: resolved_status,
    priority: normal_priority,
    description: "Docker ComposeでRedmineとAIRedmineを起動し、API接続まで確認する手順をREADMEへ反映する。",
    updated_on: 3.days.ago
  },
  {
    subject: "完了: Redmine Connectorを分離する",
    tracker: task_tracker,
    status: closed_status,
    priority: low_priority,
    description: "Redmine API呼び出しとモックデータ取得をConnectorとして分離した。",
    updated_on: 5.days.ago
  }
]

issues.each do |attrs|
  issue = Issue.find_or_initialize_by(project: project, subject: attrs[:subject])
  issue.tracker = attrs[:tracker]
  issue.status = attrs[:status]
  issue.priority = attrs[:priority]
  issue.author = admin
  issue.assigned_to = admin
  issue.description = attrs[:description]
  issue.start_date ||= Date.current
  issue.done_ratio = attrs[:status].is_closed? ? 100 : (attrs[:status].default_done_ratio || 0)
  issue.save!
  Issue.where(id: issue.id).update_all(
    updated_on: attrs[:updated_on],
    closed_on: attrs[:status].is_closed? ? attrs[:updated_on] : nil
  )
end

token = Token.find_or_create_by!(user: admin, action: "api")

puts({
  project: project.identifier,
  issues: project.issues.count,
  api_enabled: Setting.rest_api_enabled,
  api_key: token.value
}.to_json)
