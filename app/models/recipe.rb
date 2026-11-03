class Recipe < ApplicationRecord
  belongs_to :bean
  belongs_to :basket
  has_many :brews, dependent: :destroy

  def latest_brew
    brews.order(created_at: :desc).first
  end
end
