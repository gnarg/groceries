class ItemsController < ApplicationController
  def index
    session[:purchased] ||= false
    session[:purchased] = params[:purchased] if params[:purchased]

    @items = Item.select('items.*, COUNT(purchases.id) AS purchase_count')
      .left_joins(:purchases).merge(Purchase.recent)
      .where(purchased: session[:purchased])
      .order('purchase_count DESC')
      .group('items.id')
    @items = @items.limit(20) if session[:purchased]
    if (params[:search] and not params[:search].empty?)
      @items = @items.joins(tags: :taggings)
        .where("LOWER(items.name) LIKE ?", "%#{Item.sanitize_sql_like(params[:search].downcase)}%")
        .or(@items.where("tags.name LIKE ?", "%#{Item.sanitize_sql_like(params[:search].downcase)}%")).distinct
    elsif (params[:tag])
      @items = @items.tagged_with(params[:tag])
    end

    @item = Item.new
  end

  def new
    @item = Item.new
  end

  def create
    @item = Item.new(item_params)

    respond_to do |format|
      if @item.save
        format.turbo_stream
        format.html { redirect_to item_url(@item), notice: "Item was successfully created." }
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
    if params[:item][:purchased]
      Purchase.create!(item: @item)
    end

    respond_to do |format|
      if @item.update(item_params)
        format.turbo_stream
        format.html { redirect_to item_url(@item), notice: "Item was successfully updated." }
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
      format.html { redirect_to item_url, notice: "Item was successfully removed." }
      format.json { head :no_content }
    end
  end

  private
  def item_params
    if params[:item][:tag_list]
      params[:item][:tag_list].downcase!
    end
    params.require(:item).permit(:name, :purchased, :tag_list)
  end
end
