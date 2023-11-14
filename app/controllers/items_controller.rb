class ItemsController < ApplicationController
  def index
    @items = Item.all
    @item = Item.new
    @tags = Item.tag_counts
  end

  def new
    @item = Item.new
  end

  def create
    @item = Item.new(item_params)

    respond_to do |format|
      if @item.save
        format.turbo_stream
        format.html { redirect_to item_url(@item), notice: "Todo was successfully created." }
      else
        format.html { render :new, status: :unprocessable_entity }
      end
    end
  end

  def edit
    @item = Item.find(params[:id])
  end

  def update
    @item = Item.find(params[:id])

    respond_to do |format|
      if @item.update(item_params)
        format.turbo_stream
        format.html { redirect_to item_url(@item), notice: "Todo was successfully updated." }
        format.json { render :show, status: :ok, location: @item }
      else
        format.html { render :edit, status: :unprocessable_entity }
        format.json { render json: @item.errors, status: :unprocessable_entity }
      end
    end
  end

  def destroy
    @item = Item.find(params[:id])
    @item.destroy
    respond_to do |format|
      format.turbo_stream { render turbo_stream: turbo_stream.remove("#{helpers.dom_id(@item)}_container") }
      format.html { redirect_to item_url, notice: "Todo was successfully destroyed." }
      format.json { head :no_content }
    end
  end

  private
  def item_params
    params.require(:item).permit(:name, :purchased, :tag_list)
  end
end
