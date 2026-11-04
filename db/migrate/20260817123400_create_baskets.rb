class CreateBaskets < ActiveRecord::Migration[8.1]
  def change
    create_table :baskets, if_not_exists: true do |t|
      t.string :name
      t.float :min_dose
      t.float :max_dose

      t.timestamps
    end
  end
end
