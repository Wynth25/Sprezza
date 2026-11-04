class AddStarAndNotesToRecipes < ActiveRecord::Migration[8.1]
  def change
    add_column :recipes, :star, :boolean, default: false unless column_exists?(:recipes, :star)
    add_column :recipes, :notes, :text unless column_exists?(:recipes, :notes)
  end
end
