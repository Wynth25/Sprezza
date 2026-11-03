class Bean < ApplicationRecord
  has_many :recipes, -> { order(position: :asc, created_at: :asc) }, dependent: :destroy

  validates :name, :roastery, presence: true
  validate :freeze_date_after_roast_date

  # Automatically archive associated recipes when bean is archived
  after_update :archive_recipes, if: -> { archived? && saved_change_to_archived? }

  def archive_recipes
    recipes.update_all(archived: true)
  end

  def effective_frozen_date
    frozen_on || freeze_date
  end

  def effective_age_in_days
    return 0 unless roast_date
    
    if effective_frozen_date.present?
      (effective_frozen_date - roast_date).to_i
    else
      (Date.current - roast_date).to_i
    end
  end

  private

  def freeze_date_after_roast_date
    date_to_check = effective_frozen_date
    
    if date_to_check.present? && roast_date.present? && date_to_check < roast_date
      errors.add(:frozen_on, "can't be before the roast date")
    end
  end
end
