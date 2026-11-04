class Basket < ApplicationRecord
  has_many :brews, through: :recipes
  has_many :recipes, dependent: :destroy
  has_many :beans, through: :recipes

  before_validation :set_default_name, if: -> { name.blank? }

  validates :name, presence: true
  validates :min_dose, :max_dose, presence: true, numericality: { greater_than: 0 }

  def self.next_default_name
    existing = Basket.pluck(:name)
    num = 1
    while existing.any? { |name| name.to_s.strip.casecmp("Basket #{num}").zero? }
      num += 1
    end
    "Basket #{num}"
  end

  def set_default_name
    self.name = Basket.next_default_name
  end

  def display_name
    "#{name} #{min_dose}g-#{max_dose}g"
  end
end
