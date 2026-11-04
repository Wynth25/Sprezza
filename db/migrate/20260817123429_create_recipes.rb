class CreateRecipes < ActiveRecord::Migration[8.1]
  def change
    create_table :recipes, if_not_exists: true do |t|
      t.references :bean, null: false, foreign_key: true
      t.references :basket, null: false, foreign_key: true
      t.string :style
      t.string :target_ratio

      t.timestamps
    end
  end
end
