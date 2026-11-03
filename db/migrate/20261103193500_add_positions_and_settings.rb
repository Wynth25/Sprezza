class AddPositionsAndSettings < ActiveRecord::Migration[8.1]
  def change
    add_column :recipes, :position, :integer unless column_exists?(:recipes, :position)
    add_column :baskets, :position, :integer unless column_exists?(:baskets, :position)

    unless table_exists?(:settings)
      create_table :settings do |t|
        t.string :key, null: false
        t.string :value

        t.timestamps
      end
      add_index :settings, :key, unique: true
    end
  end
end
