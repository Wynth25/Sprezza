class Recipe < ApplicationRecord
  belongs_to :bean
  belongs_to :basket, optional: true
  has_many :brews, dependent: :destroy

  before_validation :normalize_mode_fields

  validates :basket, presence: true, unless: :pour_over?
  validates :water, presence: true, numericality: { only_integer: true, greater_than: 0 }, if: :pour_over?

  def pour_over?
    style.to_s.start_with?("Pour-over")
  end

  def display_title
    pour_over? ? "#{water}ml" : basket&.name
  end

  def corner_badge
    s = style.to_s
    return "R" if s.start_with?("Ristretto")
    return "L" if s.start_with?("Lungo")
    return "P" if s.start_with?("Pour-over")
    nil
  end

  def latest_brew
    brews.order(created_at: :desc).first
  end

  private

  def normalize_mode_fields
    if pour_over?
      self.basket_id = nil
    else
      self.water = nil
    end
  end
end
