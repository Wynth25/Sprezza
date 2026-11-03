class Basket < ApplicationRecord
  has_many :brews, through: :recipes
  has_many :recipes, dependent: :destroy
  has_many :beans, through: :recipes

  validates :name, presence: true
  validates :min_dose, :max_dose, presence: true, numericality: { greater_than: 0 }

  def display_name
    "#{name} #{min_dose}g-#{max_dose}g"
  end
end
