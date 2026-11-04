class CreateBeans < ActiveRecord::Migration[8.1]
  def change
    create_table :beans, if_not_exists: true do |t|
      t.string :roastery
      t.string :name
      t.text :description
      t.text :notes
      t.date :roast_date
      t.date :frozen_on

      t.timestamps
    end
  end
end
