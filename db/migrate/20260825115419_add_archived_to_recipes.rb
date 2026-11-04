class AddArchivedToRecipes < ActiveRecord::Migration[8.1]
  def change
    add_column :recipes, :archived, :boolean, default: false unless column_exists?(:recipes, :archived)
  end
end