class Setting < ApplicationRecord
  validates :key, presence: true, uniqueness: true

  def self.get(key, default = nil)
    return default unless table_exists?

    find_by(key: key.to_s)&.value.presence || default
  rescue ActiveRecord::StatementInvalid
    default
  end

  def self.set(key, value)
    record = find_or_initialize_by(key: key.to_s)
    record.update!(value: value.to_s)
  end
end
