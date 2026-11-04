class RemoveJunkFromRecipesAndBrews < ActiveRecord::Migration[8.1]
  def change
    remove_column :recipes, :target_ratio, :string if column_exists?(:recipes, :target_ratio)
    remove_column :brews, :rating, :string if column_exists?(:brews, :rating)
  end
end