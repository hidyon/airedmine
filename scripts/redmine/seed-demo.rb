# frozen_string_literal: true
# kintai-next デモデータ投入スクリプト
# 次世代勤怠管理 SaaS プロジェクトの開発 issue を 510 件以上登録する。
# 想定ユーザー: admin = 鈴木（フロントエンド担当）が AIRedmine を利用している場面。
#
# Usage: bundle exec rails runner /demo-scripts/seed-demo.rb

require "yaml"

DATA_DIR = File.expand_path("seed-data", __dir__)

User.current = User.find_by(login: "admin") || User.first
Setting.rest_api_enabled = "1"

cfg = YAML.load_file(File.join(DATA_DIR, "config.yml"))

# ===== ステータス =====
statuses = {}
cfg["statuses"].each do |s|
  st = IssueStatus.find_or_create_by!(name: s["name"]) do |obj|
    obj.position          = s["position"]
    obj.default_done_ratio = s["done_ratio"]
    obj.is_closed         = s["is_closed"] || false
  end
  st.update!(is_closed: s["is_closed"] || false, default_done_ratio: s["done_ratio"])
  statuses[s["key"]] = st
end

# ===== 優先度 =====
priorities = {}
cfg["priorities"].each do |p|
  pr = IssuePriority.find_or_create_by!(name: p["name"]) do |obj|
    obj.position   = p["position"]
    obj.active     = true
    obj.is_default = p["default"] || false
  end
  pr.update!(is_default: p["default"] || false)
  priorities[p["key"]] = pr
end

# ===== トラッカー =====
trackers = {}
cfg["trackers"].each do |t|
  tr = Tracker.find_or_create_by!(name: t["name"]) do |obj|
    obj.default_status = statuses["new"]
    obj.position       = t["position"]
  end
  trackers[t["key"]] = tr
end

# ===== プロジェクト =====
project = Project.find_or_initialize_by(identifier: "kintai-next")
project.name                 = cfg["project"]["name"]
project.description          = cfg["project"]["description"].strip
project.is_public            = true
project.status               = Project::STATUS_ACTIVE
project.trackers             = trackers.values
project.enabled_module_names = %w[issue_tracking wiki time_tracking]
project.save!

# ===== メンバー =====
members_cfg = YAML.load_file(File.join(DATA_DIR, "members.yml"))
users = {}
admin = User.current
users["suzuki"] = admin  # admin = 鈴木（フロントエンド）

members_cfg["members"].each do |m|
  next if m["key"] == "suzuki"
  u = User.find_by(login: m["login"])
  unless u
    u = User.new(
      login:                m["login"],
      firstname:            m["firstname"],
      lastname:             m["lastname"],
      mail:                 m["mail"],
      language:             "ja",
      status:               User::STATUS_ACTIVE,
      must_change_passwd:   false,
      password:             "Welcome1!",
      password_confirmation: "Welcome1!"
    )
    u.save!(validate: false)
  end
  users[m["key"]] = u
end

role = Role.where(builtin: 0).first
users.values.each do |user|
  m = Member.find_or_initialize_by(project: project, user: user)
  next unless m.new_record?
  m.roles = [role].compact
  m.save! rescue nil
end

# ===== バージョン（Sprint）=====
versions = {}
cfg["versions"].each do |v|
  date = v["days_from_now"] >= 0 \
    ? v["days_from_now"].days.from_now.to_date \
    : v["days_from_now"].abs.days.ago.to_date
  vr = Version.find_or_create_by!(project: project, name: v["name"]) do |obj|
    obj.status         = v["status"]
    obj.effective_date = date
  end
  versions[v["key"]] = vr
end

# ===== ヘルパー =====
STATUS_CYCLE   = %w[new in_progress in_progress feedback resolved closed closed closed]
PRIORITY_CYCLE = %w[low normal normal normal high high urgent]
DAYS_CYCLE     = [1, 2, 3, 5, 7, 10, 14, 20, 30, 45, 60, 90]
VERSION_CYCLE  = %w[sprint1 sprint2 sprint2 sprint3 sprint3 sprint4]

def done_ratio_for(status)
  case status.name
  when "New"         then 0
  when "In Progress" then 40
  when "Feedback"    then 20
  when "Resolved"    then 90
  when "Closed"      then 100
  else 0
  end
end

def create_issue(project:, attrs:, idx:, assigned_to:, users:, statuses:, priorities:, trackers:, versions:)
  subject = attrs["subject"].to_s.strip
  return if subject.empty?
  return unless Issue.find_or_initialize_by(project: project, subject: subject).new_record?

  status   = statuses[attrs["status"]   || STATUS_CYCLE[idx % STATUS_CYCLE.length]]
  priority = priorities[attrs["priority"] || PRIORITY_CYCLE[idx % PRIORITY_CYCLE.length]]
  tracker  = trackers[attrs["tracker"]  || "task"]
  version  = versions[attrs["version"]  || VERSION_CYCLE[idx % VERSION_CYCLE.length]]
  days     = (attrs["updated_days_ago"] || DAYS_CYCLE[idx % DAYS_CYCLE.length]).to_i
  author   = users[attrs["author"] || "suzuki"] || assigned_to

  issue = Issue.new(
    project:       project,
    subject:       subject,
    tracker:       tracker,
    status:        status,
    priority:      priority,
    assigned_to:   assigned_to,
    author:        author,
    description:   attrs["description"].to_s.strip,
    fixed_version: version,
    start_date:    [Date.current - days.days - 5.days, Date.current - 90.days].max,
    done_ratio:    done_ratio_for(status)
  )
  issue.save!

  ts = days.days.ago
  Issue.where(id: issue.id).update_all(
    updated_on: ts,
    closed_on:  status.is_closed? ? ts : nil
  )

  (attrs["journals"] || []).each do |j|
    note = Journal.new(
      journalized:   issue,
      user:          users[j["user"]] || author,
      notes:         j["note"].to_s,
      private_notes: false
    )
    note.save!(validate: false)
    Journal.where(id: note.id).update_all(created_on: j["days_ago"].to_i.days.ago)
  end

  issue
end

# ===== データファイルを読み込んで issue を作成 =====
data_files = Dir.glob(File.join(DATA_DIR, "*.yml"))
  .reject { |f| %w[config.yml members.yml].include?(File.basename(f)) }
  .sort

total = 0

data_files.each do |file|
  member_key  = File.basename(file, ".yml")
  assigned_to = users[member_key] || admin
  data        = YAML.load_file(file) || []

  data.each_with_index do |attrs, i|
    create_issue(
      project:    project,
      attrs:      attrs,
      idx:        i,
      assigned_to: assigned_to,
      users:      users,
      statuses:   statuses,
      priorities: priorities,
      trackers:   trackers,
      versions:   versions
    )
  end

  puts "  #{member_key}: #{data.size} issues"
  total += data.size
end

token = Token.find_or_create_by!(user: admin, action: "api")

puts({
  project:     project.identifier,
  issues_registered: total,
  issues_in_db:      project.issues.count,
  api_enabled: Setting.rest_api_enabled,
  api_key:     token.value
}.to_json)
