class AddWaterToRecipesAndNullableBasket < ActiveRecord::Migration[8.1]
  def change
    change_column_null :recipes, :basket_id, true
    add_column :recipes, :water, :integer unless column_exists?(:recipes, :water)
  end
end
